import { Injectable } from '@angular/core'

// Este servicio se encarga de administrar los textos que se despliegan en la 
// pagina en el idioma elegido por el usuario
@Injectable()
export class LanguageService
{
  // La lista de traducciones para todos los textos del sistema
  private translations = {
    es: { // Español
      global: {
        wait: 'Por favor espere...',
        submit: 'Subir'
      },
      upload: {
        fileLabel: 'Archivo de Datos',
        buttonLabel: 'Subir',
        vegetables: 'Vegetales y Frutas',
        basil: 'Albahaca',
        fileTypeError: 'ERROR: El archivo elegido no es de formato CSV',
        title: 'Capturar Archivo'
      },
      100: 'No se pudo reconocer el servicio solicitado',
      101: 'Faltó enviar una entrada al servidor',
      102: 'Una entrada enviada al servidor no es un valor numérico',
      103: 'Una entrada enviada al servidor esta fuera del intervalo correcto',
      104: 'Una entrada enviada al servidor no es un número entero',
      105: 'Una entrada enviada al servidor no es un número real',
      106: 'Una entrada enviada al servidor no tiene la longitud de caracteres correcta',
      107: 'La longitud de caracteres de una entrada enviada al servidor no esta dentro del intervalo apropiado',
      108: 'Una entrada enviada al servidor no es una cadena',
      109: 'Una entrada enviada al servidor no es una cadena de correo electrónico',
      110: 'Una entrada enviada al servidor no es un valor lógico',
      111: 'Una entrada enviada al servidor no es una fecha o el formato es incorrecto',
      112: 'Una entrada enviada al servidor es un arreglo vacío',
      113: 'Un archivo enviado al servidor no es un documento',
      114: 'Un archivo enviado al servidor no es una imagen',
      115: 'No se pudo enviar un archivo al servidor',
      116: 'Una entrada enviada al servidor no es un número telefónico',
      200: 'Fallo al instanciar un DAO'
    },
    en: { // Ingles
      global: {
        wait: 'Please wait...',
        submit: 'Submit'
      },
      upload: {
        fileLabel: 'Archivo de Datos',
        buttonLabel: 'Subir',
        vegetables: 'Vegetales y Frutas',
        basil: 'Albahaca',
        fileTypeError: 'ERROR: The selected file is not a CSV',
        title: 'File Submission'
      },
      100: 'Unable to recognize the requested service',
      101: 'A server input argument was not send',
      102: 'A server input argument is not a numeric value',
      103: 'A server input argument is outside the correct interval',
      104: 'A server input argument is not an integer',
      105: 'A server input argument is not a real number',
      106: "A server input argument doesn't have the proper character length",
      107: 'The character length of a server input argument is not within the proper interval',
      108: 'A server input argument is not a string',
      109: 'A server input argument is not an email string',
      110: 'A server input argument is not a boolean value',
      111: 'A server input argument is not a date or the format is incorrect',
      112: 'A server input argument is an empty array',
      113: 'A file sent to the server is not a document',
      114: 'A file sent to the server is not an image',
      115: 'A file could not be sent to the server',
      116: 'A server input argument is not a phone number',
      200: 'Failed to create an instance of a DAO'
    }
  }

  // Las interfaces publicas a todos los textos del sistema; el sistema 
  // desplegara cualquier texto que este almacenado aqui
  messages = {
    global: {
      wait: null
    },
    upload: {
      fileLabel: null,
      buttonLabel: null,
      vegetables: null,
      basil: null,
      fileTypeError: null,
      title: null
    }
  }

  // Inicializa todos los textos de la aplicacion con el idioma que este 
  // seleccionado en ese momento, cualquiera que sea
  initMessages(): void {
    for (let msg in this.messages) {
      this.messages[msg] = this.translations[localStorage.lang][msg]
    }
  }

  // Cambia los textos del sistema para que correspondan al idioma especificado
  // [in]   lang: el idioma elegido por el usuario, debe ser una opcion de:
  //        'en' o 'es'
  changeLanguage(lang: string): void {
    localStorage.lang = lang
    for (let msg in this.messages) {
      this.messages[msg] = this.translations[lang][msg]
    }
  }

  // Retorna el texto en el idioma elegido que sea adecuado para la combinacion 
  // de nombre de servicio y codigo de resultado especificados
  // [in]   service: el nombre del servicio cuyo mensaje queremos obtener
  // [in]   code: el codigo de resultado obtenido tras solicitar dicho servicio
  // [out]  return: el texto correspondiente al resultado obtenido por el 
  //        servicio especificado en el idioma seleccionado
  getServiceMessage(service: string, code: number): string {
    // inicializamos el almacenamiento temporal para el mensaje resultante
    let message = (localStorage.lang == 'en') ?
      'An unknown error occurred' : 'Ocurrió un error desconocido'
    
    if (this.translations[localStorage.lang][service] !== undefined) {
      if (this.translations[localStorage.lang][service][code] !== undefined) {
        // si existe la combinacion de servicio y codigo de resultado 
        // especificados, retornamos ese
        message = this.translations[localStorage.lang][service][code]
      }
    } else if (this.translations[localStorage.lang][code] !== undefined) {
      // si la combinacion no existe, buscamos el mensaje que corresponda 
      // unicamente el codigo de resultado especificado
      message = this.translations[localStorage.lang][code]
    }

    // retornamos el texto obtenido
    return message
  }
}