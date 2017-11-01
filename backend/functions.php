<?php

namespace Core;

// Mueve un archivo en el servidor a otra direccion con un nombre diferente
// [in]   sourceFileName (string): el nombre original del archivo a mover
// [in]   sourceFilePath (string): la direccion en donde se encuentra el 
//        archivo a mover
// [in]   destinationFolder (string): la direccion a donde se movera el archivo
// [in]   [uid] (string): identificador adicional unico que ayudara a mitigar 
//        la probabilidad de que haya una colision de nombre con otro archivo 
//        que ya exista en el sistema
// [out]  return (string): el nombre asignado al archivo despues de moverlo
function saveUploadedFileTo(
  $sourceFileName, 
  $sourceFilePath,
  $destinationFolder, 
  $uid = NULL
) {
  // primero extraemos el formato del archivo original
  $format = substr($sourceFileName, strpos($sourceFileName, '.'));

  // computamos el nuevo nombre del archivo
  $fileName = "{$uid}_".date('Y-m-d_H-i-s')."{$format}";

  // dependiendo del sistema operativo, sera la diagonal utilizada para dividir 
  // elementos de una direccion
  $s = NULL;
  if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    $s = '\\';
  } else {
    $s = '/';
  }

  // la direccion en donde sera movido el archivo
  $uploadDir = "$destinationFolder$s$fileName";

  // movemos el archivo
  $wasMoveSuccessful = 
    move_uploaded_file($sourceFilePath, $uploadDir);

  // retornamos el resultado al usuario
  return ($wasMoveSuccessful) ? $fileName : NULL;
}

// Revisa si el arreglo contiene llaves que no sean numericas (y por ende sea 
// un arreglo asotiavito en lugar de uno unidimensional) y retorna verdadero si 
// este es el caso, o falso en caso contrario
function hasStringKeys($array) {
  return count(array_filter(array_keys($array), 'is_string')) > 0;
}

?>