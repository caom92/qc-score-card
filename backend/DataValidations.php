<?php

namespace Core;

// Checks if the specified variable equals the specified value, returning 
// true if this is the case or false otherwise
function equalsValue($data, $value)
{
  if (isset($data)) {
    return $data === $value;
  } 
  return false;
}

// Checks if the specified variable is a numeric value, returning true if 
// this is the case or false otherwise
function isNumeric($data)
{
  return is_numeric($data);
}

// Checks if the specified variable has an integer value, returning true if 
// this is the case or false otherwise
function isInteger($data)
{
  return filter_var($data, FILTER_VALIDATE_INT) != NULL;
}

// Checks if the specified variable has a floating point value, returning 
// true if this is the case or false otherwise
function isFloat($data)
{
  return filter_var(
    $data, 
    FILTER_VALIDATE_FLOAT,
    FILTER_FLAG_ALLOW_THOUSAND
  ) != NULL;
}

// Checks if the specified variable has an integer value that is between 
// the two specified lower and upper limits, returning true if this is the 
// case or false otherwise
function integerIsBetweenValues($data, $min, $max)
{
  return filter_var(
    $data, 
    FILTER_VALIDATE_INT, 
    [ 'options' => [
      'min_range' => $min,
      'max_range' => $max
    ]]
  ) != NULL;
}

// Checks if the specified variable is a string, returning true if this is 
// the case or false otherwise
function isString($data)
{
  return is_string($data);
}

// Checks if the specified variable is a string with the specified number 
// of characters, returning true if this is the case or false otherwise
function stringHasLength($string, $length)
{
  if (isString($string)) {
    $currentLength = strlen($string);
    return $currentLength === $length;
  }
  return false;
}

// Checks if the specified variable is a string with a length that is 
// between the specified lower and upper characters number limit, returning 
// true if this is the case or false otherwise
function stringHasLengthInterval($string, $min, $max)
{
  if (isString($string)) {
    $currentLength = strlen($string);
    return $min <= $currentLength && $currentLength <= $max;
  }
  return false;
}

// Checks if the input argument is a string that contains a valid email 
// address returning true if this is the case or false otherwise 
function stringIsEmail($string)
{
  return filter_var($string, FILTER_VALIDATE_EMAIL) != NULL;
}

// Checks if the input argument is a string that contains the system's 
// language code of 'es' for spanish and 'en' for enlgish, returning true 
// if this is the case or false otherwise
function stringIsLanguageCode($string)
{
  if (isString($string)) {
    return $string === 'es' || $string === 'en';
  }
  return false;
}

// Checks the contents of the especified file to see if it is a PDF file
// returning true if this is the case or false otherwise
function isDocumentFile($file)
{
  if (isset($file)) {
    // check the contents of the file to get the file type
    $fileInfo = new finfo();
    $fileType = $fileInfo->file($file);
    
    // check if the file type is a PDF
    $pos = strpos($fileType, 'PDF');

    // return true if the file type is a PDF
    return ($pos !== FALSE);
  }
  return false;
}

// Checks the contents of the especified file to see if it is a bitmap file
// returning true if this is the case or false otherwise
function isBitmapFile($file)
{
  if (isset($file)) {
    // check the contents of the file and deduce the file type from there
    $fileType = exif_imagetype($file);

    // check if the file type is a bitmap
    $isJPEG = $fileType === IMAGETYPE_JPEG;
    $isPNG = $fileType === IMAGETYPE_PNG;
    $isGIF = $fileType === IMAGETYPE_GIF;
    $isBMP = $fileType === IMAGETYPE_BMP;

    // return true if the file type is a bitmap
    return ($isJPEG || $isPNG || $isGIF || $isBMP);
  }
  return false;
}

// Checks if the input argument is a date and/or time string literal 
// with the specified format, returning true if this is the case or false 
// otherwise
function isDateTime($string, $format)
{
  $dateTime = \DateTime::createFromFormat($format, $string);
  return $dateTime !== FALSE;
}

// Checks if the input argument is a boolean value, returning true if this is 
// the case or false otherwise
function isBoolean($value)
{
  // check if the value is a boolean
  if (is_bool($value)) {
    return true;
  }
  
  // check if the value is a string or an integer
  $isInteger = isInteger($value);
  $isString = isString($value);

  // if it's an integer, check if its value is 0 or greater
  if ($isInteger) {
    $value = intval($value);
    return integerIsBetweenValues($value, 0, PHP_INT_MAX);
  }

  // if it's a string, check if it resembles a boolean value
  if ($isString) {
    return 
      $value == 'true'  || 
      $value == 'false' ||
      $value == 'TRUE'  ||
      $value == 'FALSE' ||
      $value == '0'     ||
      $value == '1';
  }
  
  // for anything else, return false
  return is_bool($value);
}

// Checks if the input argument is a phone number returning true if this is the
// case or false otherwise
function isPhoneNumber($value)
{
  // primero hay que convertir la cadena a minusculas 
  $phone = strtolower($value);
  // luego, hay que remover guiones, espacios, parentesis, puntos y cadenas 
  // ext y Ext
  $phone = preg_replace('/\(|\)|\s|\.|\-|ext|Ext|EXT/', '', $phone);

  // finalmente, revisamos si la cadena resultante son puros numeros con un +
  // opcional al principio solamente
  return preg_match_all('/^\+\d{7,15}$|^\d{7,16}$/', $phone) === 1;
}

?>