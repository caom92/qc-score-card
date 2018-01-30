import { Component, OnInit } from '@angular/core'
import { ToastService } from '../services/app.toast'
import { GlobalElementsService } from '../services/app.globals'
import { LanguageService } from '../services/app.language'
import { MzModalService } from 'ng2-materialize'
import { ProgressModalComponent } from './modal.please.wait'
import { PapaParseService } from 'ngx-papaparse'
import { Zone, FileParser } from './parser.default'
import { VegetablesFileParser } from './parser.vegetables'
import { BasilFileParser } from './parser.basil'
import { ComplaintsFileParser } from './parser.complaints'

// Clase auxiliar para elegir los tipos de archivo que seran leidos
export enum FileType {
  Vegetables,
  Basil,
  Complaints
}

// Este componente define el comportamiento de la pagina donde el usuario podra 
// generar las graficas
@Component({
  templateUrl: '../templates/app.score.html'
})
export class ScoresGraphComponent implements OnInit
{
  // Bandera que indica si el boton de generar reporte debe mostrarse
  showReportButton: boolean = false

  // Limite inferior para elegir una fecha para graficar
  minDate: number = Number.MAX_SAFE_INTEGER

  // Limite superior para elegir una fecha para graficar 
  maxDate: number = 0

  // La fecha de inicio de la busqueda
  startDate: any = null
  
  // La fecha final de la busqueda
  endDate: any = null

  // La zona elegida por el usuario
  selectedZone: Zone = null

  // El producto elegido por el usuario
  selectedProduct: string = null

  // Lista de productos a elegir por el usuario
  products: Array<string> = [
    'ALL - TODOS'
  ]

  // Lista de zonas a elegir por el usuario
  zones: Array<Zone> = [{
    name: 'ALL - TODAS',
    products: [ 'ALL - TODOS' ]
  }]

  // Los archivos que seran procesados para generar las graficas
  files: Array<FileParser> = [ null, null, null ]

  // El constructor de este componente, inyectando los servicios requeridos
  constructor(
    private toastManager: ToastService,
    private global: GlobalElementsService,
    private langManager: LanguageService,
    private csvFileReader: PapaParseService,
    private modalManager: MzModalService
  ) {
    this.selectedZone = this.zones[0]
  }

  // Esta funcion se invoca cuando el componente es inicializado
  ngOnInit() {
    // instanciamos el lector para cada tipo de archivo 
    this.files[FileType.Vegetables] = 
      new VegetablesFileParser(this.csvFileReader)
    this.files[FileType.Basil] = 
      new BasilFileParser(this.csvFileReader)
    this.files[FileType.Complaints] = 
      new ComplaintsFileParser(this.csvFileReader)

    // variables auxiliares para rastrear el estado de los archivos a leer
    let numFilesFinished: number = 0
    let allFilesOK: boolean = true

    // Funcion a invocar cuando el archivo haya terminado de ser leido 
    // exitosamente
    let onComplete = () => {
      // incrementamos el numero de archivos leidos
      ++numFilesFinished

      // si este fue el ultimo archivo en leer...
      if (numFilesFinished == this.files.length) {
        // cerramos el modal de espera
        modal.instance.modalComponent.close()

        // revisamos si hubo algun problema al leer los archivos...
        if (allFilesOK) {
          // si no lo hubo, calculamos la interceccion entre los limites 
          // inferior y superior de fecha, zonas y productos de los 3 archivos
          this.mergeFileData()
        } else {
          // si lo hubo, notificamos al usuario
          this.toastManager.showText(
            this.langManager.messages.upload.error
          )
        } // if (allFilesOK)
      } // if (numFilesFinished == this.files.length)
    } // let onComplete

    // Funcion a invocar cuando el archivo haya terminado de ser leido con 
    // algun error
    let onError = (error, file) => {
      // incrementamos el numero de archivos leidos
      ++numFilesFinished

      // cambiamos la bandera de estado para indicar que hubo un error con uno 
      // de los archivos
      allFilesOK = false

      // si este fue el ultimo archivo en leer...
      if (numFilesFinished == this.files.length) {
        // si lo hubo, notificamos al usuario
        this.toastManager.showText(
          this.langManager.messages.upload.error
        )
      } // if (numFilesFinished == this.files.length)
    } // let onError = (error, file)

    // desplegamos el modal de proceso de espera
    let modal = this.modalManager.open(ProgressModalComponent)

    // leemos los archivos de forma concurrente
    for (let file of this.files) {
      file.read(onComplete, onError)
    }
  }

  // Combina los datos de todos los archivos leidos para desplegar las opciones 
  // apropiadas al usuario
  mergeFileData(): void {
    // vaciamos el arreglo de zonas y productos
    this.zones = []
    this.products = []
    
    // primero obtenemos los limites inferior y superior para las fechas 
    // seleccionables por el usuario considerando los datos presentes en todos 
    // los archivos
    this.minDate = Math.max(
      this.files[FileType.Vegetables].minDate,
      this.files[FileType.Basil].minDate,
      this.files[FileType.Complaints].minDate
    )

    this.maxDate = Math.min(
      this.files[FileType.Vegetables].maxDate,
      this.files[FileType.Basil].maxDate,
      this.files[FileType.Complaints].maxDate
    )

    // compararemos los datos de los 3 archivos para agregar a la lista final 
    // de zonas y productos aquellos que estan presentes en los 3
    for (let type of [FileType.Vegetables, FileType.Basil]) {
      // por cada zona del archivo...
      for (let zone of this.files[type].zones) {
        // la buscamos en el archivo de quejas
        let complaintsZone: Zone = this.files[FileType.Complaints].zones.find(
          (x) => x.name == zone.name
        )

        // si la zona esta registrada en el archivo de quejas...
        if (complaintsZone !== undefined) {
          // calculamos la interceccion de los productos de esa zona con la 
          // zona actual para descartar aquellas productos que no estan 
          // registrados en el archivo de quejas
          let products = zone.products.filter(
            x => complaintsZone.products.includes(x)
          )

          // luego revisamos si esta zona ya esta registrada en el arreglo final
          if (products.length > 0) {
            let i = this.zones.findIndex((x) => x.name == zone.name)
            if (i == -1) {
              // si la zona no esta registrada, la agregamos al arreglo final 
              // de zonas
              this.zones.push({
                name: zone.name,
                products: products
              })
            } else {
              // si la zona ya esta registrada en el arreglo final de zonas, 
              // calculamos la union entre los productos de la zona actual y la 
              // zona registrada en el arreglo final para agregar estos 
              // productos al registro final sin repetirlos
              products = Array.from(new Set([ 
                ...this.zones[i].products, 
                ...products
              ]))

              if (products.length > 0) {
                this.zones[i].products = products.splice(0)
              }
            } // if (i == -1)
          }
        } // if (complaintsZone !== undefined)
      } // for (let zone of this.files[type].zones)
    } // for (let type of [FileType.Vegetables, FileType.Basil])

    // una vez que se tiene la lista final de arreglos, vamos a calcular la 
    // lista final de productos; esto se logra calculando la interseccion entre 
    // los productos del archivo de quejas con uno de los otros dos archivos 
    // (para descartar aquellos productos que no esten registrados en el 
    // archivo de quejas) y los conjuntos resultantes seran unidos (para tener 
    // un solo conjunto con todos los productos en todos los archivos sin 
    // duplicados)

    // interseccion entre el archivo de quejas y de vegetales
    let vegetablesProducts = this.files[FileType.Vegetables].products.filter(
      x => this.files[FileType.Complaints].products.includes(x)
    )

    // interseccion entre el archivo de quejas y de albahaca
    let basilProducts = this.files[FileType.Basil].products.filter(
      x => this.files[FileType.Complaints].products.includes(x)
    )

    // union entre ambas intersecciones
    this.products = Array.from(new Set([ 
      ...vegetablesProducts, 
      ...basilProducts
    ]))

    // ordenamos los productos por orden alfabetico
    this.products.sort()

    // agregamos la opcion de "Todos" al inicio del arreglo de productos
    this.products = [ 'ALL - TODOS' ].concat(this.products)

    // ordenamos el arreglo de zonas por orden alfabetico
    this.zones.sort((a: Zone, b: Zone) => 
      (a.name == b.name) ? 0 : (a.name < b.name) ? -1 : 1
    )

    // ordenamos los productos de cada zona y agregamos la opcion de "Todos" al 
    // inicio al arreglo de productos de cada zona
    for (let zone of this.zones) {
      zone.products.sort()
      zone.products = [ 'ALL - TODOS' ].concat(zone.products)
    }

    // agregamos la opcion de "Todos" al inicio del arreglo de zonas
    this.zones = [{ 
      name: 'ALL - TODAS', 
      products: this.products 
    }].concat(this.zones)

    // colocamos un valor por defecto en la seleccion de zona y producto
    this.selectedZone = this.zones[0]
    this.selectedProduct = this.zones[0].products[0]

    // calculamos los limites inferior y superior para la seleccion de fecha
    this.computeDateLimits()
  }

  // Calcula las fechas para los limites inferior y superior del calendario de 
  // eleccion de fecha para el usuario 
  computeDateLimits(): void {
    // preparamos un arreglo con los datos necesarios para computar cada limite
    let limits = [
      {
        name: 'min',
        model: 'minDate',
        value: null
      },
      {
        name: 'max',
        model: 'maxDate',
        value: null
      }
    ]

    // visitamos cada limite
    for (let l of limits) {
      // obtenemos la fecha y la guardamos como el limite
      let tempDate = null
      this.langManager.translations.es.global.datePickerConfig[l.name] = 
      this.langManager.translations.en.global.datePickerConfig[l.name] =
      tempDate =
        new Date(this[l.model])

      // formateamos la fecha para que se envie apropiadamente al servidor 
      let month = tempDate.getMonth() + 1
      let day = tempDate.getUTCDate()
      let date = 
        `${ tempDate.getFullYear() }-` +
        `${ (month < 10) ? '0' + month : month }-` +
        `${ (day < 10) ? '0' + day : day }`

      // guardamos la fecha formateada
      l.value = date
    }

    // una vez computadas las fechas, las guardamos para su uso futuro
    this.startDate = limits[0].value
    this.endDate = limits[1].value
  }

  // Esta funcion se invoca cuando el usuario elije una zona
  onZoneSelected(): void {
    this.selectedProduct = this.selectedZone.products[0]
  }

  // Esta funcion se invoca cuando el usuario hace clic en el boton de graficar
  onGraphButtonClicked(): void {
    for (let file of this.files) {
      file.createChartsAndReport(
        this.startDate,
        this.endDate,
        this.selectedZone.name,
        this.selectedProduct,
        []
      )
    }
  }
}