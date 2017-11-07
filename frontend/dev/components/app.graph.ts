import { Component, OnInit, Input } from '@angular/core'
import { ToastService } from '../services/app.toast'
import { GlobalElementsService } from '../services/app.globals'
import { LanguageService } from '../services/app.language'
import { StateService } from '@uirouter/angular'
import { FileType } from './app.upload'
import { PapaParseService } from 'ngx-papaparse'

class ColumnKey 
{
  numItems: number = 0

  percentage: number = 0

  name: string = null

  constructor(name: string) {
    this.name = name
  }
}

class Category extends ColumnKey
{
  color: string = null
  keys: Array<ColumnKey> = []

  constructor(name: string, color: string) {
    super(name)
    this.color = color
  }
}

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

  // Opciones de configuracion que determinan como desplegar las graficas en la 
  // pantalla
  chartsConfig: {
    categories: Array<Category>,
    numItems: number,
    zoneKey: string,
    productKey: string,
    charts: Array<any>
  } = {
    categories: [
      new Category('No Defects Found', 'rgb(0, 153, 0)'),
      new Category('Quality', 'rgb(255, 255, 0)'),
      new Category('Conditional', 'rgb(255, 128, 0)'),
      new Category('Serious Conditional', 'rgb(255, 0, 0)')
    ],
    numItems: 0,
    zoneKey: null,
    productKey: null,
    charts: null
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
        this.chartsConfig.productKey = 'ItemCode'
        this.chartsConfig.zoneKey = 'Project'
        this.chartsConfig.categories[1].keys = [
          new ColumnKey('Undersized'),
          new ColumnKey('Oversized'),
          new ColumnKey('InsectDamage'),
          new ColumnKey('Scarring')
        ]
        this.chartsConfig.categories[2].keys = [
          new ColumnKey('Discoloration'),
          new ColumnKey('InsectPresenceFrass'),
          new ColumnKey('Softness'),
          new ColumnKey('Bruising')
        ]
        this.chartsConfig.categories[3].keys = [
          new ColumnKey('Decay'),
          new ColumnKey('DehydrationShrivel'),
          new ColumnKey('AbnormalSoftness'),
          new ColumnKey('UnhealedCutsSplits')
        ]
      break

      case FileType.Basil:
        this.chartsConfig.productKey = 'ItemCode'
        this.chartsConfig.zoneKey = 'CardCode'
        this.chartsConfig.categories[1].keys = [
          new ColumnKey('Undersized%'),
          new ColumnKey('Oversized%'),
          new ColumnKey('InsectDamage%'),
        	new ColumnKey('Flowers%')
        ]
        this.chartsConfig.categories[2].keys = [
          new ColumnKey('Discoloration%'),
          new ColumnKey('SevereInsectFrass%'),
          new ColumnKey('MechanicalDamage%')
        ]
        this.chartsConfig.categories[3].keys = [
          new ColumnKey('Dehydration%'),
          new ColumnKey('Decay%'),
          new ColumnKey('Yellowing%'),
          new ColumnKey('Wetness%'),
          new ColumnKey('DiseasePresence%')
        ]
      break
    }

    // leemos la informacion del archivo CSV y lo almacenamos en un JSON para 
    // facilitar su manejo
    this.file.info = this.csvParser.parse(this.file.info, {
      delimiter: ',',
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    })

    // visitamos cada renglon del archivo
    for (let row of this.file.info.data) {
      // revisamos si el producto se encuentra en la lista de productos
      let idx = products.indexOf(row[this.chartsConfig.productKey]
        .toUpperCase())
      
      // si no se encuentra, lo agregamos
      if (idx == -1) {
        products.push(row[this.chartsConfig.productKey].toUpperCase())
      }

      // hacemos lo mismo con la zona
      idx = zones.indexOf(row[this.chartsConfig.zoneKey].toUpperCase())
      
      if (idx == -1) {
        zones.push(row[this.chartsConfig.zoneKey].toUpperCase())
      }
    }

    // ordenamos la lista temporal de zonas y productos
    zones.sort()
    products.sort()

    // agregamos la lista temporal a la lista final de zonas y productos
    this.zones = this.zones.concat(zones)
    this.products = this.products.concat(products)
  }

  // Calcula el acumulado de productos para cada categoria registrada en el 
  // archivo leido
  computeTally(): void {
    // visitamos cada renglon del archivo
    for (let row of this.file.info.data) {
      // si el usuario eligio una zona especifica, solo contabilizaremos los 
      // objetos registrados en esa zona
      if (this.selectedZone != 'ALL - TODAS') {
        if (row[this.chartsConfig.zoneKey] != this.selectedZone) {
          continue
        }
      }

      // si el usuario eligio un producto especifico, solo contabilizaremos los 
      // objetos de ese tipo de producto
      if (this.selectedProduct != 'ALL - TODOS') {
        if (row[this.chartsConfig.productKey] != this.selectedProduct) {
          continue
        }
      }

      // acumulamos el conteo total de objetos registrados; algunos archivos 
      // pueden tener cantidades escritas con una coma que divide las milesimas 
      // de las centecimas, estos numeros no son transformados automaticamente 
      // en tipo number, sino que permanecen como string, debemos considerar 
      // esto al leer las cantidades 
      this.chartsConfig.numItems += (typeof row['Itemcount'] === 'number') ?
        row['Itemcount']
        : parseFloat(row['Itemcount'].replace(/\,/g, ''))

      // visitamos cada categoria
      for (let c of this.chartsConfig.categories) {
        // visitamos cada columna que esta asociada a esta categoria
        for (let k of c.keys) {
          // acumulamos el valor de esta columna, cuidando aquellos numeros 
          // que mencione anteriormente
          let numItems = (typeof row[k.name] === 'number') ?
            row[k.name]: parseFloat(row[k.name].replace(/\,/g, '')) 
          k.numItems += numItems
          c.numItems += numItems
        } // for (let j of this.chartsConfig.categories[i])
      } // for (let i of categories)
    } // for (let row of this.file.info.data)
  } // computeTally(): any

  // Calcula los valores porcentuales que ultimadamente seran desplegados en 
  // las graficas 
  computePercentage(): void {
    // preparamos el porcentaje de los productos que no tuvieron defectos
    this.chartsConfig.categories[0].percentage = 100

    // calculamos el divisor para calcular el porcentaje
    let totalNumItems = 100 / this.chartsConfig.numItems

    // visitamos cada categoria que no sea aquella donde no se encontraron 
    // defectos
    for (let c of this.chartsConfig.categories) {
      if (c.name != 'No Defects Found') {
        // calculamos el divisor para calcular el porcentaje
        let categoryNumItems = 100 / c.numItems

        // visitamos cada columna de la categoria
        for (let k of c.keys) {
          // calculamos el porcentaje de la columna en base a la categoria
          k.percentage += k.numItems * categoryNumItems

          // calculamos el porcentaje de la categoria en base al total global
          c.percentage += k.numItems * totalNumItems
        }

        // actualizamos el porcentaje correspondiente a la categoria sin 
        // defectos
        this.chartsConfig.categories[0].percentage -= c.percentage
      } // if (c.name != 'No Defects Found')
    } // for (let c of this.chartsConfig.categories)
  } // computePercentage(): void

  // Crea las graficas en pantalla
  createChart(): void {
    // borramos las graficas anteriores
    this.chartsConfig.charts = []
    
    // preparamos los datos de configuracion de la grafica de pastel
    let pieTrace = {
      values: [ this.chartsConfig.categories[0].percentage ],
      labels: [ this.chartsConfig.categories[0].name ],
      marker: { 
        colors: [ this.chartsConfig.categories[0].color ] 
      },
      type: 'pie'
    }

    // visitamos cada categoria
    for (let c of this.chartsConfig.categories) {
      // llenamos el porcentaje de la categoria en la grafica de pastel
      pieTrace.values.push(c.percentage)
      pieTrace.labels.push(c.name)
      pieTrace.marker.colors.push(c.color)

      // visitamos toda categoria que no sea la que no tenia defectos
      if (c.name != 'No Defects Found') {
        // preparamos los datos de configuracion para la grafica de barras
        let barTrace = {
          x: [],
          y: [],
          marker: {
            color: c.color
          },
          orientation: 'h',
          type: 'bar'
        }

        // visitamos el porcentaje de cada columna de la categoria
        // para llenar los datos de la grafica de pastel 
        for (let k of c.keys) {
          barTrace.x.push(k.percentage)
          barTrace.y.push(k.name)
        }

        // agregamos la grafica de barra resultante al arreglo de graficas
        this.chartsConfig.charts.push({
          data: [ barTrace ],
          layout: {
            width: 600,
            height: 360,
            title: c.name,
            yaxis: {
              tickangle: -60
            }
          },
          options: {}  
        })
      } // if (c.name != 'No Defects Found')
    } // for (let c of this.chartsConfig.categories)

    // obtenemos los datos de configuracion de la grafica de pastel
    let pieChart = {
      data: [ pieTrace ],
      layout: {
        width: 600,
        height: 360,
        title: 'Pending'
      },
      options: {}
    }

    // graficamos la grafica de pastel
    Plotly.newPlot(
      'chart0', 
      pieChart.data, 
      pieChart.layout, 
      pieChart.options
    )

    // graficamos todas las demas graficas de barra
    for (let i = 0; i < this.chartsConfig.charts.length; ++i) {
      Plotly.newPlot(
        `chart${ i + 1 }`,
        this.chartsConfig.charts[i].data,
        this.chartsConfig.charts[i].layout,
        this.chartsConfig.charts[i].options
      )
    }
  }

  // Esta funcion se invoca cuando el usuario hace clic en el boton de graficar
  onGraphButtonClicked(): void {
    this.computeTally()

    if (this.chartsConfig.numItems == 0) {
      this.toastManager.showText(
        this.langManager.messages.graph.noResults
      )
      return 
    }

    this.computePercentage()
    this.createChart()
  }
}