import { Component, OnInit, Input } from '@angular/core'
import { ToastService } from '../services/app.toast'
import { GlobalElementsService } from '../services/app.globals'
import { LanguageService } from '../services/app.language'
import { StateService } from '@uirouter/angular'
import { FileType } from './app.upload'
import { PapaParseService } from 'ngx-papaparse'

// Este componente describe el comportamiento de la pantalla donde se 
// graficaran los datos del archivo
@Component({
  templateUrl: '../templates/app.graph.html'
})
export class GraphComponent implements OnInit
{
  // La zona elegida por el usuario
  selectedZone: string = 'ALL - TODAS'

  // El producto elegido por el usuario
  selectedProduct: string = 'ALL - TODOS'

  // El archivo subido
  @Input()
  file: {
    type: FileType,
    info: any
  } = {
    type: FileType.None,
    info: null
  }

  // Los encabezados del archivo
  headers: Array<string> = []

  // Lista de productos a elegir por el usuario
  products: Array<string> = [
    'ALL - TODOS'
  ]

  // Lista de zonas a elegir por el usuario
  zones: Array<string> = [
    'ALL - TODAS'
  ]

  keys = {
    product: null,
    zone: null,
    conditional: [],
    seriousConditional: [],
    quality: []
  }

  // El constructor de este componente, inyectando los servicios requeridos
  constructor(
    private toastManager: ToastService,
    private global: GlobalElementsService,
    private langManager: LanguageService,
    private router: StateService,
    private csvParser: PapaParseService
  ) {
  }

  // Esta funcion se ejecuta al iniciar la pagina
  ngOnInit(): void {
    // inicializamos variables temporales para almacenar renglones, zonas y 
    // productos
    let tempRows = []
    let zones = []
    let products = []

    // inicializamos variables que contendran los encabezados para el producto 
    // y la zona, dependiendo del tipo de archivo subido por el usuario
    switch (this.file.type) {
      case FileType.Vegetables:
        this.keys.product = 'ItemCode'
        this.keys.zone = 'Project'
        this.keys.conditional = [
          'Discoloration',
          'InsectPresenceFrass',
          'Softness',
          'Bruising',
          'Undersized',
          'Oversized',
          'InsectDamage',
          'Scarring'
        ]
        this.keys.seriousConditional = [
          'Decay',
          'DehydrationShrivel',
          'AbnormalSoftness',
          'UnhealedCutsSplits'
        ]
      break

      case FileType.Basil:
        this.keys.product = 'ItemCode'
        this.keys.zone = 'CardCode'
        this.keys.conditional = [
          'Discoloration%',
          'SevereInsectFrass%',
          'MechanicalDamage%'
        ]
        this.keys.seriousConditional = [
          'Dehydration%',
          'Decay%',
          'Yellowing%',
          'Wetness%',
          'DiseasePresence%'
        ]
        this.keys.quality = [
          'Undersized%',
          'Oversized%',
          'InsectDamage%',
        	'Flowers%'
        ]
      break
    }

    this.file.info = this.csvParser.parse(this.file.info, {
      delimiter: ',',
      header: true,
      dynamicTyping: true
    })
    for (let row of this.file.info.data) {
      // revisamos si el producto se encuentra en la lista de productos
      let idx = products.indexOf(row[this.keys.product].toUpperCase())
      
      // si no se encuentra, lo agregamos
      if (idx == -1) {
        products.push(row[this.keys.product].toUpperCase())
      }

      // hacemos lo mismo con la zona
      idx = zones.indexOf(row[this.keys.zone].toUpperCase())
      
      if (idx == -1) {
        zones.push(row[this.keys.zone].toUpperCase())
      }
    }

    // ordenamos la lista temporal de zonas y productos
    zones.sort()
    products.sort()

    // agregamos la lista temporal a la lista final de zonas y productos
    this.zones = this.zones.concat(zones)
    this.products = this.products.concat(products)
  }

  onGraphButtonClicked(): void {
    let tally = {
      items: 0
    }
    let categories = Object.keys(this.keys)

    let i = categories.indexOf('product')
    categories.splice(i, 1)
    i = categories.indexOf('zone')
    categories.splice(i, 1)

    for (let row of this.file.info.data) {
      if (this.selectedZone != 'ALL - TODAS') {
        if (row[this.keys.zone] != this.selectedZone) {
          continue
        }
      }

      if (this.selectedProduct != 'ALL - TODOS') {
        if (row[this.keys.product] != this.selectedProduct) {
          continue
        }
      }
      
      tally.items += parseFloat(row['Itemcount'])

      for (let i of categories) {
        if (tally[i] === undefined) {
          tally[i] = {}
        }

        for (let j of this.keys[i]) {
          if (tally[i][j] === undefined) {
            tally[i][j] = parseFloat(row[j])
          } else {
            tally[i][j] += parseFloat(row[j])
          }
        }
      }
    }

    console.log(tally)
  }
}