import { Component, OnInit, Input } from '@angular/core'
import { ToastService } from '../services/app.toast'
import { GlobalElementsService } from '../services/app.globals'
import { LanguageService } from '../services/app.language'
import { StateService } from '@uirouter/angular'
import { FileType } from './app.upload'
import { PapaParseService } from 'ngx-papaparse'
import { MzModalService } from 'ng2-materialize'
import { ProgressModalComponent } from './modal.please.wait'

// Esta clase define la base para declarar el componente que graficara los 
// datos de uno de los archivos leidos
export abstract class GraphComponent
{
  // El archivo subido
  @Input()
  file: {
    type: FileType,
    info: any
  } = {
    type: FileType.None,
    info: null
  }

  // Configuracion del reporte PDF que sera enviado al servidor
  reportForm: {
    lang: string,
    content: string,
    style: string,
    company: string,
    address: string, 
    logo: string,
    orientation: string,
    footer: string,
    supervisor: string,
    signature: string
  } = {
    lang: localStorage.lang,
    content: JSON.stringify([{
      header: '',
      body: '',
      footer: ''
    }]),
    style: `
      <style>
        table.header { 
          font-family: arial, 
          sans-serif; 
          border-collapse: collapse;
          max-height: 100%
        }
        table.header td { 
          border: 1px solid #000000; 
          text-align: left;
        }
        table.header th { 
          border: 1px solid #000000; 
          text-align: left; 
          font-weight: bold; 
          background-color: #4CAF50;
        }
        table {
          border: none;
        }
      </style>
    `,
    company: 'Agroproductos Del Cabo S. A. de C. V.',
    address: 'Carretera Transpeninsular km 125.5 Maneadero Parte Alta',
    logo: 'default.png',
    orientation: 'L',
    footer: '',
    supervisor: '',
    signature: ''
  }

  // La funcion a invocar cuando se lee el archivo CSV
  onFileReadCallback: (results: any, file: any) => void = 
    (results, file) => null

  // El constructor de este componente, inyectando los servicios requeridos
  constructor(
    protected toastManager: ToastService,
    protected global: GlobalElementsService,
    protected langManager: LanguageService,
    protected router: StateService,
    protected csvParser: PapaParseService,
    protected modalManager: MzModalService
  ) {
  }

  // Crea las graficas en pantalla
  abstract createChart(): void
  
  // Esta funcion crea un archivo de imagen por cada grafica generada por el 
  // usuario 
  abstract createChartBitmaps(): void

  // Lee el archivo elegido por el usuario
  readFile(): void {
    // desplegamos el modal de proceso de espera
    let modal = this.modalManager.open(ProgressModalComponent)
    
    this.csvParser.parse(this.file.info, {
      delimiter: ',',
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      download: true,
      complete: (results, file) => {
        // cerramos el modal de espera
        modal.instance.modalComponent.close()

        // guardamos el contenido del archivo para procesarlo
        this.file.info = results
  
        // notificamos al usuario que el archivo se leyo exitosamente
        this.toastManager.showText(
          this.langManager.messages.upload.success
        )

        this.onFileReadCallback(results, file)
      },
      error: (error, file) => {
        // cerramos el modal de espera
        modal.instance.modalComponent.close()

        // notificamos al usuario que el archivo se leyo exitosamente
        this.toastManager.showText(
          this.langManager.messages.upload.error
        )
        console.log(error)
      }
    })
  }
}