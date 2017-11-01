<?php

require_once realpath(__DIR__.'/ServiceProvider.php');
require_once realpath(dirname(__FILE__).'/dao/TableFactory.php');
require_once realpath(dirname(__FILE__).'/services/services.php');

use \Core\ServiceProvider as ServiceProvider;
use \DataBase\TableFactory as TableFactory;

// Definimos los validadores personalizados que vamos a utilizar en
// este proyecto
// ServiceProvider::addValidationRule(
//   'nombre del validador', 
//   function($scope, $name, $value, $options) {
//   }
// );

// Instanciamos el provedor de servicios
$controller = new ServiceProvider(
  [
    // 'daoFactory' => function($config) {
    //   return new TableFactory(
    //     'profile name',
    //     'DataBase\\',
    //     [
    //       'table name' => 'file path'
    //     ]
    //   );
    // },
    // 'nombre del servicio global' => function($config) {
    // }
  ],
  [
    'GET' => [
      // 'nombre del servicio' => function($scope, $request) {
      // }
    ],
    'PUT' => [
      // 'nombre del servicio' => function($scope, $request) {
      // }
    ],
    'POST' =>  [
      // 'nombre del servicio' => function($scope, $request) {
      // }
    ],
    'DELETE' => [
      // 'nombre del servicio' => function($scope, $request) {
      // }
    ]
  ]
);

// Proveemos el servicio
$controller->serveRemoteClient();

?>