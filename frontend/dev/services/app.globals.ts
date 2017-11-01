import { Injectable } from '@angular/core'

// Este servicio contiene los atributos y metodos declarados en el componente 
// de la pantalla principal para que puedan ser accesibles a otros componentes 
// derivados del mismo
@Injectable()
export class GlobalElementsService
{
  // Retorna la fecha de hoy en una cadena con formato AAAA-MM-DD
  getFormattedDate(): string {
    // primero obtenemos la fecha de hoy 
    let today = new Date()

    // luego obtenemos el año, el mes y el dia individualmente como cadenas
    let year = today.getUTCFullYear().toString()
    let month = (today.getMonth() + 1).toString()
    let day = today.getUTCDate().toString()

    // el mes y el dia no estan precedidos por un 0 cuando son valores menores 
    // a 10, para corregir esto, le agregamos el 0 al principio y luego 
    // recuperamos los ultimos 2 caracteres; si el valor es menor a 10, 
    // agregarle el 0 hara que la cadena tenga solo 2 caracteres, por lo que la 
    // funcion slice() retornara la cadena completa, en cambio si el valor es 
    // mayor a 10, agregarle el 0 hara que la cadena tenga 3 caracteres y la 
    // funcion slice retornara los ultimos 2 caracteres, borrando el cero que 
    // le habiamos agregado
    month = ('0' + month).slice(-2)
    day = ('0' + day).slice(-2)

    // retornamos la cadena de fecha formateada
    return `${ year }-${ month }-${ day }`
  }
} // export class HomeElementsService