<?php

namespace DataBase;

// Una interfaz para acceder a y modificar los datos almacenados dentro de una 
// tabla especifica en la base de datos
class DataBaseTable
{ 
  // El nombre de la tabla que este objeto representa
  protected $table;

  // Interfaz que representa la conexion a la base de datos
  protected $db;

  // La lista de las consultas SQL que fueron cacheadas para ser reutilizadas
  // luego
  private $cachedQueries = [];
 
  // Crea una interfaz para interactuar con la tabla en la base de datos que 
  // tenga el nombre especificado
  // [in]   db (PDO): la instancia de la interfaz que representa la conexion a 
  //        la base de datos que contiene la tabla representada por esta clase
  // [in]   table (string): el nombre de la tabla que el objeto representara
  function __construct($db, $table) {
    $this->db = $db;
    $this->table = $table;
  }

  // Retorna verdadero si la consulta con el indice especificado fue creado 
  // anteriormente y esta guardado en cache o falso en caso contrario
  protected function isStatementCached($index) {
    return 
      isset($this->cachedQueries[$index])
      && array_key_exists($index, $this->cachedQueries);
  }

  // Retorna una instancia del PDOStatement que corresponde a la consulta SQL 
  // especificada
  // [in]   index (string): el indice que se utilizara para buscar la consulta 
  //        en la lista de consultas cacheadas
  // [in]   query (string): la consulta SQL cuyo PDOStatement deseamos obtener
  // [out]  return (PDOStatement): la interfaz que representa los datos 
  //        obtenidos al ejecutar la consulta especificada en la base de datos
  protected function getStatement($index, $query) {
    if (!$this->isStatementCached($index)) {
      $this->cachedQueries[$index] = $this->db->prepare($query);
    }

    return $this->cachedQueries[$index];
  }
}   // class DataBaseTable

?>