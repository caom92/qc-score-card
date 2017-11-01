<?php

namespace Core;

// El URL despues del nombre del sitio desde donde se acceden a los servicios
const SERVICES_ROOT = '/services/';

// El archivo donde se almacenan los logs del servidor
const LOG_FILE = 'app.log';

// Configuracion de acceso CORS
const CORS_REQUESTS = [
  // Permite que el servidor atienda peticiones llegadas de otros dominios web  
  'allowed' => FALSE,

  // Permite que el servidor atienda peticiones llegadas de otros dominios web 
  // y que hagan uso de una cookie de sesion (solo funciona si "allowed" esta 
  // encendida)
  'with_credentials' => FALSE,

  // La cadena que indica cuales son los dominios web desde donde el servidor 
  // puede atender peticiones que vengan con una cookie de sesion (solo 
  // funciona si "with_credentials" esta encendida)
  'allowed_origins' => [
    'http://localhost:4200'
  ]
];

?>