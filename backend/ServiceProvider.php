<?php

namespace Core;

require_once realpath(__DIR__.'/config/site.php');
require_once realpath(__DIR__.'/vendor/autoload.php');
require_once realpath(__DIR__.'/DataValidations.php');

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;
use \Exception as Exception;

// Esta clase representa el objeto que nos permite recibir una peticion del 
// cliente, procesarla y entregarle un recurso como resultado
class ServiceProvider
{
  // Instancia de la aplicacion Slim que nos permite manejar las peticiones
  private $app;

  // Instancia del contenedor de la aplicacion Slim que nos permite inyectar 
  // servicios en el contexto global 
  private $container;

  // Una lista de todas las reglas de validacion que se pueden aplicar a 
  // los datos de entrada recibidos desde cliente al ejecutar un servicio
  private static $validationRules;

  // Crea una instancia del manejador de servicios
  function __construct($globals, $services) {
    // Creamos una instancia de Slim con la configuracion indicada
    $this->app = new \Slim\App([
      'settings' => [
        'displayErrorDetails' => true
      ]
    ]);

    // Obtenemos el contenedor de Slim para poder inyectar servicios adicionales
    $this->container = $this->app->getContainer();

    // Inyectamos el servicio PDO para manejar logs en el servidor
    $this->container['log'] = function($config) {
      // creamos una instancia del logger
      $logger = new \Monolog\Logger('AppLog');

      // agregamos el manejador de archivos a la pila de manejadores para 
      // desplegar la informacion en el archivo indicado por la configuracion 
      // del servidor
      $logger->pushHandler(new \Monolog\Handler\StreamHandler(
        realpath(__DIR__).'/'.LOG_FILE
      ));

      // retornamos la instancia de Monolog
      return $logger;
    };

    // Inyectamos el manejador de sesiones
    $this->container['session'] = function($config) {
      ini_set('session.name', 'SessionCookie');
      ini_set('session.hash_function', 'sha512');
      ini_set('session.cookie_httponly', '1');
      ini_set('session.use_strict_mode', '1');
      $factory = new \Aura\Session\SessionFactory;
      return $factory->newInstance($_COOKIE);
    };

    // Configuramos los objetos de error retornados por el servidor al toparse
    // con los errores HTTP 404 y 405 para que retornen objetos JSON igual que 
    // todas las otras respuestas del servidor
    $this->container['notFoundHandler'] = function($config) {
      return function ($request, $response) use ($config) {
        return $config['response']
          ->withStatus(404)
          ->getBody()->write(ServiceProvider::prepareResponse(
            [], 404, 'The requested service does not exist'
          ));
      };
    };

    $this->container['notAllowedHandler'] = function($config) {
      return function($request, $response, $methods) use ($config) {
        return $config['response']
          ->withStatus(405)
          ->withHeader('Allow', implode(', ', $methods))
          ->getBody()->write(ServiceProvider::prepareResponse(
            [], 405, 'Method must be one of: ' . implode(', ', $methods)
          ));
        return $result;
      };
    };

    // Ahora visitamos cada elemento del arreglo de servicios globales
    foreach ($globals as $name => $service) {
      $this->container[$name] = $service;
    }

    // configuramos los encabezados necesarios en caso de que este 
    // activado la bandera para permitir acceso CORS
    if (CORS_REQUESTS['allowed']) {
      $this->app->add(function($request, $response, $next) {
        // preparamos los encabezados de la respuesta a enviar al cliente
        $response = $response->withHeader(
          'Content-Type', 
          'application/json;charset=utf8'
        );
        $response = $response->withHeader(
          'Access-Control-Allow-Headers', 
          'X-Requested-With, Content-Type, Accept, Origin, Authorization'
        );
        $response = $response->withHeader(
          'Access-Control-Allow-Methods', 
          'PUT, GET, POST, DELETE, OPTIONS'
        );

        // si el acceso CORS requiere una cookie de sesion, la 
        // configuracion de los encabezados debe incluir una lista de los 
        // dominios web cuyas peticiones vamos a aceptar
        if (CORS_REQUESTS['with_credentials']) {
          // necesitamos asegurarnos de que el cliente proviene 
          // de un origen autorizado, asi que primero obtenemos el origen
          $currentOrigin = rtrim($_SERVER['HTTP_REFERER'], '/');

          // inicializamos la bandera que indica si este origen esta 
          // autorizado
          $isOriginAllowed = FALSE;

          // tenemos que comparar el origen actual con la lista de origenes 
          // autorizados uno por uno
          foreach (CORS_REQUESTS['allowed_origins'] as $origin) {
            if ($currentOrigin == $origin) {
              $isOriginAllowed = TRUE;
              break;
            }
          } // foreach (CORS_REQUESTS['allowed_origins'] as $origin)

          // si el origen actual esta autorizado para usar credenciales de 
          // autentificacion con CORS, inicializamos el resto de los 
          // encabezados necesarios
          if ($isOriginAllowed) {
            $response = $response->withHeader(
              'Access-Control-Allow-Credentials', 
              'true'
            );
            $response = $response->withHeader(
              'Access-Control-Allow-Origin', 
              $currentOrigin
            );
          } // if ($isOriginAllowed)
        } else {
          // si no es necesario permitir CORS con credenciales de 
          // autentificacion, permitimos el acceso a cualquier origen
          $response = $response->withHeader(
            'Access-Control-Allow-Origin', 
            '*'
          );
        } // if (CORS_REQUESTS['with_credentials'])

        // ejecutamos el servicio y obtenemos la respuesta
        return $next($request, $response);
      }); // $this->app->add(function($request, $response, $next) {})

      // finalmente agregamos un servicio que procese las peticiones 
      // 'preflight' cuando las peticiones CORS estan activadas
      $this->app->options(
        SERVICES_ROOT.'{routes:.+}', 
        function($request, $response, $args) {
          return $response;
        }
      );
    } else {
      // si no es necesario permitir acceso CORS, entonces simplemente 
      // preparamos los encabezados de respuesta
      $this->app->add(function(Request $request, Response $response, $next) {
        // preparamos los encabezados de la respuesta a enviar al cliente
        $response = $response->withHeader(
          'Content-Type', 
          'application/json;charset=utf8'
        );

        // ejecutamos el servicio y obtenemos la respuesta
        return $next($request, $response);
      });
    } // if (CORS_REQUESTS['allowed'])

    // Ahora visitamos cada elemento del arreglo de servicios
    foreach ($services as $method => $serviceList) {
      foreach ($serviceList as $name => $import) {
        // guardamos el URI completo con el cual se puede solicitar la ejecucion
        // de este servicio
        $name = SERVICES_ROOT.$name;

        // creamos la funcion que contiene las acciones a ejecutar cuando se
        // llama este servicio
        $callback = function(Request $request, Response $response, $args) 
          use ($import, $name)
        {
          // revisamos que el archivo donde se definio el servicio exista
          if (!isset($import) || strlen($import) == 0) {
            throw new \Exception(
              "Failed to import the definition file for service '$import', ".
              "the file could not be found. Check that the file exists and ". 
              "that the correct file path was provided.",
              100
            );
          }

          // inicializamos la variable que almacenara el resultado del servicio
          $result = NULL;

          // inicializamos la variable que almacenara las reglas de validacion
          // y la funcion a invocar para el servicio
          $service = NULL;

          // importamos el archivo que contiene la declaracion del servicio
          require_once $import;

          // intentamos ejecutar el servicio
          try {
            // obtenemos los datos enviados junto con la peticion y los 
            // almacenamos en un arreglo asociativo para su mas facil uso
            $data = $request->getParsedBody();
            $data = array_merge(
              isset($data) ? $data : [], 
              $args
            );

            // validamos los datos de entrada recibidos por el servicio desde el
            // cliente
            ServiceProvider::validateServiceInputArguments(
              $this, $data, $service['requirements_desc']
            );

            // ejecutamos el servicio
            $result = $service['callback']($this, $data);

            // preparamos la respuesta a enviar al cliente
            $result = ServiceProvider::prepareResponse($result);
          } catch (Exception $e) {
            // si una exception fue lanzada, retornamos un mensaje de error al 
            // cliente
            $this->log->error($e->getMessage());
            $result = ServiceProvider::prepareResponse(
              [], $e->getCode(), $e->getMessage()
            );
          } finally {
            // escribimos la respuesta
            $response->getBody()->write($result);
          }

          // y la enviamos al cliente
          return $response;
        }; // $callback = function(Request $request, Response $response, $args)

        // configuramos el servicio dependiendo del metodo HTTP que debe 
        // utilizar
        // https://www.slimframework.com/docs/objects/router.html#how-to-create-routes
        switch ($method) {
          // Para lectura de datos de la BD
          case 'GET':
            $this->app->get($name, $callback);
          break;

          // Para crear elementos en la BD
          case 'POST':
            $this->app->post($name, $callback);
          break;

          // Para modificacion de elementos en la BD
          case 'PUT':
            $this->app->put($name, $callback);
          break;

          // Para borrar elementos de la BD
          case 'DELETE':
            $this->app->delete($name, $callback);
          break;

          default:
            throw new Exception(
              "Failed to configure the Slim application; the specified HTTP ".
              "method '$method' is not valid.",
              100
            );
          break;
        } // switch ($method)
      } // foreach ($serviceList as $name => $import)
    } // foreach ($services as $method => $serviceList)
  } // function __construct($globals, $services)

  // Agrega una nueva regla de validacion para los datos de entrada que pueden
  // ser enviados desde el cliente junto con una peticion para un servicio
  // [in]   name (string): el nombre de la regla de validacion que va a ser
  //        agregada
  // [in]   callback (function(scope:object, name:string, value:any, 
  //        options:array)): la funcion a invocar para ejecutar la regla de 
  //        validacion y validar un campo de entrada
  static function addValidationRule($name, $callback) {
    self::$validationRules[$name] = $callback;
  }
  
  // Ejecutamos la aplicacion para atender las peticiones recibidas
  function serveRemoteClient() {
    $this->app->run();
  }

  // Inyecta un nuevo servicio en el contexto de Slim
  // [in]   name (string): el nombre de la variable en donde se va a almacenar 
  //        este servicio
  // [in]   callback (function(config:array):any): la funcion que creara la 
  //        instancia del servicio al momento de ser inyectado desde el contexto
  function addScopeService($name, $callback) {
    $this->container[$name] = $callback;
  }

  // Prepara el objeto JSON que sera enviado como respuesta al cliente
  // [in]   response (ResponseInterface): el objeto PSR-7 que almacena nuestra
  //        respuesta
  // [in]   [data] (array): arreglo asociativo que contiene los datos a 
  //        retornar al cliente
  // [in]   [code] (int): el codigo de retorno que representa el estado en el 
  //        cual concluyo la ejecucion del servicio; 0 significa exito
  // [in]   [message] (string): una cadena que contiene un mensaje descriptivo
  //        sobre el resultado retornado por el servicio
  private static function prepareResponse($data = [], $code = 0, 
    $message = 'Success') 
  {
    // revisamos si tanto el mensaje como el codigo de retorno indican 
    // que el servicio concluyo exitosamente con su ejecucion
    $isCodeSuccess = $code == 0;
    $isMessageSuccess = $message == 'Success';
    
    // creamos el objeto JSON apropiado almacenando los datos a enviar dentro
    // de el
    return json_encode([
      'meta' => [
        'return_code' => ($isMessageSuccess && $isCodeSuccess) ?
          0 : ($isCodeSuccess) ? 1 : $code,
        'message' => $message
      ],
      'data' => $data
    ]);
  }

  // Revisa que el cliente envio los datos de entrada correctos para ejecutar
  // el servicio requerido
  // [in]   scope (object): el objeto que contiene el contexto de slim 
  // [in]   request (array): arreglo asociativo que contiene los datos de 
  //        entrada enviados desde el cliente
  // [in]   requirementsDesc (array): arreglo asociativo que describe las
  //        reglas de validacion que seran aplicadas a cada dato de entrada
  //        correspondiente
  // [out]  throw: si alguno de los datos de entrada no cumple con sus reglas
  //        de validacion respectivas, se arrojara una excepcion detallando
  //        el dato que no cumplio con las reglas y la regla especifica que
  //        fallo la prueba
  private static function validateServiceInputArguments(
    $scope, $request, $requirementsDesc
  ) {
    // validamos los datos de entrada segun fueron especificadas las reglas de
    // validacion
    foreach ($requirementsDesc as $attribute => $options) {
      // primero revisamos si el argumento de entrada fue declarado como
      // opcional o no
      $hasOptionalFlag = 
        isset($options['optional']) && array_key_exists('optional', $options);
      $isOptional = ($hasOptionalFlag) ? $options['optional'] : false;

      // luego revisamos que el cliente haya enviado el argumento esperado
      $hasAttribute = 
        isset($request[$attribute]) 
        && array_key_exists($attribute, $request);
      
      // despues revisamos si la regla que vamos a evaluar se decide con el
      // atributo type
      $isTypedRule = isset($options['type']) 
          && array_key_exists('type', $options);

      // inicializamos el nombre del validador y el valor a evaluar
      $rule = $value = NULL;

      // si el validador se obtendra por el atributo type del descriptor de 
      // requerimientos...
      if ($isTypedRule) {
        // y el atributo a evaluar fue proporcionado por el cliente
        if ($hasAttribute) {
          // obtenemos el nombre del validador y el valor a evaluar adecuados
          $rule = $options['type'];
          $value = $request[$attribute];
        } else if (!$isOptional && $options['type'] != 'files') {
          // si el argumento no fue enviado desde el cliente y no fue declarado 
          // como opcional, entonces hay que lanzar una excepcion
          throw new Exception("Input argument $attribute is undefined", 101);
        } else {
          // si el argumento no fue enviado pero es opcional, podemos brincar 
          // esta validacion y continuar con los otros argumentos
          continue;
        }
      } else {
        // si el validador se obtendra por el nombre del atributo en el 
        // descriptor de requerimientos, obtenemos el nombre del validador
        // y el valor a evaluar adecuados
        $rule = $attribute;
        $value = NULL;
      } 

      // finalmente obtenemos el validador y lo utilizamos para validar el 
      // argumento de entrada 
      $callback = self::$validationRules[$rule];
      $callback($scope, $attribute, $value, $options);
    }
  }

  // Esta funcion inicializa las reglas de validacion que existen por defecto
  // en el sistema
  static function initDefaultValidationRules() {
    self::$validationRules = [
      'number' => function($scope, $name, $value, $options) {
        // revisamos si la variable tiene un valor numerico
        if (!isNumeric($value)) {
          // si no lo tiene, notificamos al usuario
          throw new Exception(
            "Input argument '$name' is not a numeric value",
            102
          );
        }
      },
      'int' => function($scope, $name, $value, $options) {
        // revisamos si la variable es un entero
        $isInt = isInteger($value);

        // luego, revisamos si este valor debe estar dentro de algun intervalo
        $hasMinRule = isset($options['min']);
        $hasMaxRule = isset($options['max']);
        $hasRules = $hasMinRule || $hasMaxRule;

        // si el dato de entrada es entero...
        if ($isInt) {
          // y existen reglas adicionales de validacion por procesar
          if ($hasRules) {
            // calculamos los limites del intervalo
            $min = ($hasMinRule) ? $options['min'] : PHP_INT_MIN;
            $max = ($hasMaxRule) ? $options['max'] : PHP_INT_MAX;

            // y revisamos que el valor de la variable se encuentre dentro
            // del intervalo
            if (!integerIsBetweenValues($value, $min, $max)) {
              throw new Exception(
                "Input argument '$name' is not within [$min, $max]",
                103
              );
            }
          }
        } else {
          // si la variable no posee un valor entro, notificamos al cliente
          throw new Exception(
            "Input argument '$name' is not an integer value",
            104
          );
        }
      },
      'float' => function($scope, $name, $value, $options) {
        // revisamos que la variable posea un valor de coma flotante
        if (!isFloat($value)) {
          throw new Exception(
            "Input argument '$name' is not a floating-point value",
            105
          );
        }
      },
      'string' => function($scope, $name, $value, $options) {
        // revisamos que la variable posea una cadena
        $isString = isString($value);

        // luego revisamos si la variable debe poseer una longitud especifica
        // de caracteres
        $hasLengthRule = isset($options['length']);

        // tambien revisamos si la variable debe tener un numero de caracteres
        // que se encuentre dentro de un intervalo
        $hasMinLengthRule = isset($options['min_length']);
        $hasMaxLengthRule = isset($options['max_length']);

        // si la variable de entrada es una cadena ...
        if ($isString) {
          // y debe poseer una longitud de caracteres especifica ...
          if ($hasLengthRule) {
            // revisamos que la cadena tenga la longitud especifica
            if (!stringHasLength($value, $options['length'])) {
              throw new Exception(
                "Input argument '$name' does not have a length of ".
                $options['length'],
                106
              );
            }
          } else {
            // revisamos si la longitud de la cadena esta dentro del 
            // intervalo especificado
            $min = ($hasMinLengthRule) ? $options['min_length'] : 0;
            $max = ($hasMaxLengthRule) ? $options['max_length'] : PHP_INT_MAX;
            
            // si no lo tiene, notificamos al usuario
            if (!stringHasLengthInterval($value, $min, $max)) {
              throw new Exception(
                "Input argument '$name' does not have a length that is ".
                "within [$min, $max]",
                107
              );
            }
          }
        } else {
          // si la variable no es una cadena, notificamos al usuario
          throw new Exception(
            "Input argument '$name' is not a string value",
            108
          );
        }
      },
      'email' => function($scope, $name, $value, $options) {
        // revisamos si la variable es una cadena con un formato valido de 
        // correo electronico
        if (!stringIsEmail($value)) {
          throw new Exception(
            "Input argument '$name' is not an email string",
            109
          );
        }
      },
      'bool' => function($scope, $name, $value, $options) {
        // revisamos si el argumento de entrada es un booleano
        $isBoolean = isBoolean($value);
        if (!$isBoolean) {
          throw new Exception(
            "Input argument '$name' is not a boolean value",
            110
          );
        }
      },
      'datetime' => function($scope, $name, $value, $options) {
        // revisamos si la variable es una cadena con un formato valido de 
        // hora y/o fecha
        if (!isDateTime($value, $options['format'])) {
          throw new Exception(
            "Input argument '$name' is not a date and/or time literal of ".
            "the format '{$options['format']}'",
            111
          );
        }
      },
      'array' => function($scope, $name, $value, $options) {
        // primero revisamos si el arreglo fue declarado como opcional
        $hasOptionalFlag = 
          isset($options['optional']) && array_key_exists('optional', $options);
        $isOptional = ($hasOptionalFlag) ? $options['optional'] : false;
        // despues revisamos si el arreglo esperado es simple o asociativo
        $isSimpleArray = isset($options['values']['type'])
          && array_key_exists('type', $options['values']);
                    
        // si el arreglo no esta vacio, validamos sus contenidos
        $length = count($value);
        if ($length > 0) {
          // si el arreglo es sencillo ...
          if ($isSimpleArray) {
            // obtenemos el validador que le corresponde al tipo de dato que
            // se espera que tenga cada elemento
            $rule = $options['type'];
            $validator = self::$validationRules[$rule];

            // y validamos cada elemento 
            for ($i = 0; $i < $length; $i++) {
              $validator("$name[$i]", $value[$i], $options['values']);
            }
          } else {
            // si el arreglo es un arreglo asociativo, debemos invocar esta
            // funcion asociativamente
            foreach ($value as $element) {
              ServiceProvider::validateServiceInputArguments(
                $scope, $element, $options['values']
              );
            }
          }
        } else if (!$isOptional) {
          // si el arreglo esta vacio y no fue declarado como opcional, 
          // lanzamos una excepcion
          throw new Exception("Input argument $name is an empty array", 112);
        }
      },
      'files' => function($scope, $name, $value, $options) {
        // primero, obtenemos el nombre del archivo
        $name = $options['name'];

        // revisamos que se hayan enviado archivos
        $isFilesSet = isset($_FILES[$name]) 
          && array_key_exists($name, $_FILES);

        // tambien revisamos que se haya especificado el tipo de archivo que se 
        // espera que estos archivos tengan
        $isFileFormatSet = isset($options['format'])
          && array_key_exists('format', $options);

        // y revisamos si los archivos fueron declarados como opcionales
        $isOptional = isset($options['optional'])
          && array_key_exists('optional', $options);

        // si se enviaron archivos desde el cliente...
        if ($isFilesSet) {
          // y se especifico que se espera un tipo de archivo
          if ($isFileFormatSet) {
            // validamos que todos los archivos enviados sean del tipo 
            // especificado, notificando al usuario cuando este no es el caso
            switch ($options['format']) {
              case 'document':
                if (is_array($_FILES[$name]['tmp_name'])) {
                  foreach ($_FILES[$name]['tmp_name'] as $file) {
                    if (!isDocumentFile($file)) {
                      throw new Exception(
                        "A file in '$name' is not a document file",
                        113
                      );
                      break;
                    }
                  }
                } else if (!isDocumentFile($_FILES[$name]['tmp_name'])) {
                  throw new Exception(
                    "The file '{$_FILES[$name]['name']}' is not a document ".
                    "file",
                    113
                  );
                }
              break;
              case 'bitmap':
                if (is_array($_FILES[$name]['tmp_name'])) {
                  foreach ($_FILES[$name]['tmp_name'] as $file) {
                    if (!isBitmapFile($file)) {
                      throw new Exception(
                        "A file in '$name' is not a bitmap file",
                        114
                      );
                      break;
                    }
                  }
                } else if (!isBitmapFile($_FILES[$name]['tmp_name'])) {
                  throw new Exception(
                    "The file '{$_FILES[$name]['name']}' is not a bitmap file",
                    114
                  );
                }
              break;
            }
          }
        } else {
          // si no se enviaron archivos desde el cliente y no fueron declarados 
          // como opcionales, notificamos al usuario
          if (!$isOptional) {
            throw new Exception("File '$name' is undefined", 115);
          }
        }
      },
      'phone' => function($scope, $name, $value, $options) {
        // revisamos si el argumento de entrada es un numero telefonico
        $isPhoneNum = isPhoneNumber($value);
        if (!$isPhoneNum) {
          throw new Exception(
            "Input argument '$name' is not a phone number",
            116
          );
        }
      }
    ];
  }
}

// Inicializamos las reglas de validacion que existen por defecto en el sistema
ServiceProvider::initDefaultValidationRules();