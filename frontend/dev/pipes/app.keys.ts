import { Pipe, PipeTransform } from '@angular/core'

// Este es una interfaz que permite extraer las llaves de un arreglo que tenga 
// la estructura tipo llave-valor
@Pipe({ 
  name: 'keys' 
})
export class KeysPipe implements PipeTransform 
{
  transform(value): any {
    // extraemos las llaves del objeto ingresado y las regresamos en un arreglo
    return (value) ? Object.keys(value) : null
  }
}