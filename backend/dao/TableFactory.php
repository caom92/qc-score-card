<?php

namespace DataBase;

require_once realpath(__DIR__."/../config/db.php");

// Interfaz que administra la creacion de interfaces de tablas
// a la base de datos
class TableFactory
{
  // El espacio de nombre donde las clases de las tablas fueron definidas
  private $namespace;

  // La instancia que representa la conexion a la base de datos
  private $db;

  // Lista de instancias de tablas creadas previamente
  private $tables = [];

  // Lista de direcciones de archivo donde se encuentran las definiciones
  // de clases de las diferentes tablas de la base de dato
  private $tableClassDefinitionFiles = [];
  
  // Crea una nueva instancia del administrador de tablas
  // [in]   profileName (string): el nombre del perfil de acceso cuyos datos se 
  //        utilizaran para establecer una conexion a la base de datos; los 
  //        perfiles pueden configurarse en el archivo db.php
  // [in]   namespace (string): el espacio de nombre donde las clases de las 
  //        tablas fueron definidas
  // [in]   tablestableClassDefinitionFiles (dictionary): arreglo asociativo
  //        que define las direcciones de los archivos que contienen las
  //        definiciones de las clases que representan las tablas en la
  //        base de datos organizados por nombre de clase
  function __construct(
    $profileName, 
    $namespace, 
    $tablestableClassDefinitionFiles
  ) {
    $this->db = new \PDO(
      'mysql:host='.DB_PROFILES[$profileName]['host'].';'.
      'dbname='.DB_PROFILES[$profileName]['db'].';charset=utf8mb4',
      DB_PROFILES[$profileName]['user'],
      DB_PROFILES[$profileName]['password'],
      [
        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
        \PDO::ATTR_EMULATE_PREPARES => FALSE,
        \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC
      ]   
    );
    $this->namespace = $namespace;
    $this->tableClassDefinitionFiles = $tablestableClassDefinitionFiles;
  }

  // Retorna verdadero si la conexion a la base de datos fue establecida o falso
  // en caso contrario
  function isDataBaseConnectionEstablished() {
    return isset($this->db);
  }

  // Retorna una instancia de la interfaz de tabla con el nombre especificado
  // [in]   tableName (string): el nombre de la interfaz de tabla que queremos
  //        instanciar
  // [out]  return (object): una instancia de la clase de tabla que fue 
  //        especificada
  // [out]  throw (Exception): en caso de que la clase no este definida, se 
  //        lanza una excepcion
  function get($tableName) {
    // primero revisamos si la tabla ya habia sido instanciada antes
    $isTableInitialized =
      isset($this->tables[$tableName])
      && array_key_exists($tableName, $this->tables);

    if ($isTableInitialized) {
      // si la tabla ya habia sido instanciada, regresamos dicha instancia
      return $this->tables[$tableName];
    } else {
      // si no, revisamos si tenemos la direccion del archivo en donde se 
      // encuentra definida la clase
      $isTableDefined =
        isset($this->tableClassDefinitionFiles[$tableName])
        && array_key_exists($tableName, $this->tableClassDefinitionFiles);

      if ($isTableDefined) {
        // hay que revisar si la direccion del archivo fue capturada 
        // correctamente
        if (strlen($this->tableClassDefinitionFiles[$tableName]) <= 0) {
          // si no lo fue, lanzamos una excepcion
          throw new \Exception(
            "Failed to create an instance of '$tableName', ".
            "the file path associated to this class name could not be ".
            "resolved to any file. Maybe the file path is misspelled.",
            200
          );
        }

        // si tenemos el archivo, lo incluimos
        include $this->tableClassDefinitionFiles[$tableName];

        // instanciamos la clase
        $className = $this->namespace . $tableName;
        $this->tables[$tableName] = new $className($this->db);

        // y retornamos dicha instancia
        return $this->tables[$tableName];
      } else {
        // si no tenemos el archivo, lanzamos una excepcion
        throw new \Exception
        (
          "Failed to create an instance of '$tableName', no class file is ".
          "associated to this class name. Maybe the class name is misspelled.",
          200
        );
      } // if ($isTableDefined)
    } // if ($isTableInitialized)
  } // function get($tableName)
} // class TableFactory

?>