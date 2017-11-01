import { Injectable } from '@angular/core'
import { Http, Response, Headers, RequestOptions, URLSearchParams } from '@angular/http'
import { Observable } from 'rxjs/Rx'
import { environment } from '../environments/environment'

// El tipo de objeto que es retornado del servidor como respuesta a cualquier 
// peticion
export type BackendResponse = {
  meta: {
    message: string
    return_code: number
  },
  data: any
}

// Tipo auxiliar para definir el callback que atendera la respuesta del servidor
type OnSuccessCallback = (response: BackendResponse) => void

// Tipo auxiliar para definir el callback que se invocara cuando la 
// comunicacion con el servidor haya fallado
type OnErrorCallback = (error: any, caught: Observable<void>) => Array<any>

// Servicio que proporciona la interfaz con la cual el backend puede 
// comunicarse con el backend de la aplicacion
@Injectable()
export class BackendService 
{
  // El URL a donde se enviaran las peticiones de servicio al backend de la 
  // aplicacion
  static url: any = {
    default: 'http://localhost/',
  }

  // Los encabezados del paquete HTTP que sera enviado
  private static headers = new Headers({ 
    'Accept': 'application/json'  // esperamos recibir un JSON de respuesta
  })

  // La funcion que sera ejecutada en caso de que la comunicacion con el 
  // servidor falle
  private static defaultErrorCallback: OnErrorCallback = 
    (error: any, caught: Observable<void>) => {
      // simplimente arrojamos una excepcion para que sea capturada en una 
      // parte mas alta del programa
      Observable.throw(error)
      return []
    }

  // El constructor de este servicio
  constructor(private http: Http) {
    // haremos uso de la interfaz HTTP de Angular
  }

  // Envia una solicitud al servidor por el metodo POST
  // [in]   service: el nombre del servicio que sera solicitado al servidor
  // [in]   data: los datos que van a ser enviados junto con la peticion
  // [in]   successCallback: la funcion a ejecutarse en caso de que la 
  //        comunicacion con el servidor se haya realizado con exito
  // [in]   [url]: el URL del servidor al cual vamos a solicitar el servicio
  // [in]   [errorCallback]: la funcion a ejecutarse en caso de que la 
  //        comunicacion con el servidor haya fallado
  write(
    service: string, 
    data: FormData, 
    successCallback: OnSuccessCallback,
    url: string = BackendService.url.default,
    errorCallback: OnErrorCallback = BackendService.defaultErrorCallback
  ): void {
    this.http
      .post(
        url + service,
        data,
        new RequestOptions({
          headers: BackendService.headers,
          withCredentials: true
        })
      )
      .map((response: Response) => {
        // convertimos el resultado en JSON 
        let result = JSON.parse(response['_body'].toString())

        // invocamos la funcion de exito especificada por el usuario
        successCallback(result)
      })
      .catch(errorCallback)
      .subscribe()
  }

  // Solicita datos del servidor por el metodo GET
  // [in]   service: el nombre del servicio que sera solicitado al servidor
  // [in]   data: los datos que van a ser enviados junto con la peticion
  // [in]   successCallback: la funcion a ejecutarse en caso de que la 
  //        comunicacion con el servidor se haya realizado con exito
  // [in]   [url]: el URL del servidor al cual vamos a solicitar el servicio
  // [in]   [errorCallback]: la funcion a ejecutarse en caso de que la 
  //        comunicacion con el servidor haya fallado
  read(
    service: string, 
    data: any, 
    successCallback: OnSuccessCallback, 
    url: string = BackendService.url.default,
    errorCallback: OnErrorCallback = BackendService.defaultErrorCallback
  ): void {
    // debido a que el metodo GET debe ser enviado con un cuerpo vacio, habra 
    // que pasar los parametros del servicio en el URL, sin embargo, debido a 
    // que el backend esta implementado utilizando Slim PHP, este solo puede 
    // configurar rutas con parametros, es decir, no puede enrutar peticiones 
    // que contengan query strings en su URL, debido a esto, hay que desglozar 
    // los parametros ingresados y adjuntarlos a la URL del servicio 
    // dividiendolos con diagonales
    let params = ''
    for (let i in data) {
      params += '/' + data[i]
    }

    this.http
      .get(
        BackendService.url.default + service + params,
        new RequestOptions({ 
          headers: BackendService.headers,
          withCredentials: true
        })
      )
      .map((response: Response) => {
        // convertimos el resultado en JSON 
        let result = JSON.parse(response['_body'].toString())

        // invocamos la funcion de exito especificada por el usuario
        successCallback(result)
      })
      .catch(errorCallback)
      .subscribe()
  }

  // Envia una solicitud al servidor por el metodo DELETE
  // [in]   service: el nombre del servicio que sera solicitado al servidor
  // [in]   data: los datos que van a ser enviados junto con la peticion
  // [in]   successCallback: la funcion a ejecutarse en caso de que la 
  //        comunicacion con el servidor se haya realizado con exito
  // [in]   [url]: el URL del servidor al cual vamos a solicitar el servicio
  // [in]   [errorCallback]: la funcion a ejecutarse en caso de que la 
  //        comunicacion con el servidor haya fallado
  delete(
    service: string, 
    data: any, 
    successCallback: OnSuccessCallback, 
    url: string = BackendService.url.default,
    errorCallback: OnErrorCallback = BackendService.defaultErrorCallback
  ): void {
    // se sigue el mismo proceso de desglozamiento de parametros del servicio 
    // seguido en la funcion read() de esta clase
    let params = ''
    for (let i in data) {
      params += '/' + data[i]
    }

    this.http
      .delete(
        BackendService.url.default + service + params,
        new RequestOptions({
          headers: BackendService.headers,
          withCredentials: true
        })
      )
      .map((response: Response) => {
        // convertimos el resultado en JSON 
        let result = JSON.parse(response['_body'].toString())

        // invocamos la funcion de exito especificada por el usuario
        successCallback(result)
      })
      .catch(errorCallback)
      .subscribe()
  }
}