import { Component, OnInit, Input } from '@angular/core'
import { ToastService } from '../services/app.toast'
import { GlobalElementsService } from '../services/app.globals'
import { LanguageService } from '../services/app.language'
import { StateService } from '@uirouter/angular'
import { FileType } from './app.upload'
import { PapaParseService } from 'ngx-papaparse'
import { MzModalService } from 'ng2-materialize'
import { ProgressModalComponent } from './modal.please.wait'
import { GraphComponent } from './graph.default'

// Clase auxiliar que define los atributos asociados con una zona 
export class Zone
{
  name: string
  products: Array<string>
}

// Esta clase define la base para declarar el componente que graficara los 
// datos de uno de los archivos leidos
export abstract class DateZoneProductCategoryGraphComponent 
  extends GraphComponent implements OnInit
{
  // Bandera que indica si el boton de generar reporte debe mostrarse
  showReportButton: boolean = false
  
  // Bandera que indica si el contenido de este componente debe desplegarse o no
  displayContent: boolean = false 

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

  // Opciones de configuracion que determinan como desplegar las graficas en la 
  // pantalla
  chartsConfig: {
    zoneKey: string,
    productKey: string,
    dateKey: string,
    charts: Array<any>,
    data: any
  } = {
    zoneKey: null,
    productKey: null,
    dateKey: null,
    charts: null,
    data: null
  }

  // El constructor de este componente, inyectando los servicios requeridos
  constructor(
    toastManager: ToastService,
    global: GlobalElementsService,
    langManager: LanguageService,
    router: StateService,
    csvParser: PapaParseService,
    modalManager: MzModalService
  ) {
    super(
      toastManager,
      global,
      langManager,
      router,
      csvParser,
      modalManager
    )
  }

  // Esta funcion se invocara cuando el componente sea iniciado
  abstract onComponentInit(): void

  // Esta funcion se ejecuta al iniciar la pagina
  ngOnInit(): void {
    // iniciamos el componente
    this.onComponentInit()

    // configuramos la funcion que leera el archivo
    this.onFileReadCallback = (results, file) => {
      // desplegamos el contenido del componente
      this.displayContent = true

      // almacenamiento temporal para zonas y productos revisados
      let checkedZones: Array<string> = []
      let zones: Array<Zone> = []
      let products: Array<string> = []

      // visitamos cada renglon del archivo
      for (let row of this.file.info.data) {
        let zone = row[this.chartsConfig.zoneKey].toUpperCase()
        let product = row[this.chartsConfig.productKey].toUpperCase()
        let idx = checkedZones.indexOf(zone)

        if (idx > -1) {
          let p = zones[idx].products.indexOf(product)
          if (p == -1) {
            zones[idx].products.push(product)
          }
        } else {
          checkedZones.push(zone)
          zones.push({ 
            name: zone,
            products: [ product ]
          })
        }

        // revisamos si el producto se encuentra en la lista de productos
        idx = products.indexOf(product)
        
        // si no se encuentra, lo agregamos
        if (idx == -1) {
          products.push(product)
        }

        // obtenemos la fecha de este registro
        let date = 
          Date.parse(row[this.chartsConfig.dateKey].replace(/\s/g, ''))
        
        // si la fecha es mas chica que el limite inferior, la almacenamos 
        // como el nuevo limite inferior
        if (date < this.minDate) {
          this.minDate = date
        }

        // si la fecha es mas grande que el limite superior, la almacenamos
        // como el nuevo limite superior
        if (date > this.maxDate) {
          this.maxDate = date
        }
      }

      // guardamos los limites inferior y superior para la seleccion de fecha
      this.computeDateLimits()

      // ordenamos la lista temporal de zonas y productos
      zones.sort(function(a, b) {
        if (a.name < b.name) {
          return -1
        } else if (a.name > b.name) {
          return 1
        } else {
          return 0
        }
      })
      products.sort()

      // agregamos la lista temporal a la lista final de zonas y productos
      this.zones = this.zones.concat(zones)
      this.zones[0].products = this.zones[0].products.concat(products)

      for (let zone of this.zones) {
        let products = zone.products.splice(0)
        products.sort()
        zone.products = [
          'ALL - TODOS'
        ]
        zone.products = zone.products.concat(products)
      }
    } // this.onFileReadCallback = (results, file) => void

    // leemos el archivo
    this.readFile()
    this.selectedZone = this.zones[0]
    this.selectedProduct = this.zones[0].products[0]
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

  // Realiza todas las computaciones necesarias para desplegar el estado final 
  // de las graficas
  abstract initChart(): void

  // Esta funcion se invoca cuando el usuario hace clic en el boton de graficar
  onGraphButtonClicked(): void {
    // preparamos las graficas
    this.initChart()

    // desplegamos las graficas
    this.createChart()
    
    // creamos las imagenes que seran enviadas al servidor para generar el 
    // reporte PDF
    this.createChartBitmaps()

    // desplegamos el boton para generar el reporte PDF
    this.showReportButton = true
  } // onGraphButtonClicked(): void

  // Esta funcion se invoca cuando el usuario elije una zona
  onZoneSelected(): void {
    this.selectedProduct = null
  }
}