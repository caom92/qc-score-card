import { Component, OnInit, Input } from '@angular/core'
import { ToastService } from '../services/app.toast'
import { GlobalElementsService } from '../services/app.globals'
import { LanguageService } from '../services/app.language'
import { StateService } from '@uirouter/angular'
import { FileType } from './app.upload'
import { PapaParseService } from 'ngx-papaparse'
import { MzModalService } from 'ng2-materialize'
import { ProgressModalComponent } from './modal.please.wait'

// Clase auxiliar que define los atributos necesarios para generar las graficas 
// leidos cada columna del archivo
class ColumnKey 
{
  // El numero de unidades de producto que fueron registrados en esa columna
  numItems: number = 0

  // El porcentaje de cajas totales que fueron registrados en esa columna
  percentage: number = 0

  // El nombre de la columna
  name: string = null

  // Constructor
  constructor(name: string) {
    this.name = name
  }
}

// Clase auxiliar que define los atributos necesarios para generar las graficas
// leidos de cada categoria de columnas
class Category extends ColumnKey
{
  // El color que representa esta categoria
  color: string = null

  // Los nombres de las columnas que pertenecen a esta categoria
  keys: Array<ColumnKey> = []

  // Constructor
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
  // Bandera que indica si el boton de generar reporte debe mostrarse
  showReportButton: boolean = false

  // Bandera que indica si el contenido de este componente debe desplegarse o no
  displayContent: boolean = false 

  // Limite inferior para elegir una fecha para graficar
  minDate: number = Number.MAX_SAFE_INTEGER

  // Limite superior para elegir una fecha para graficar 
  maxDate: number = 0

  // La zona elegida por el usuario
  selectedZone: {
    name: string,
    products: Array<string>
  } = {
    name: 'ALL - TODAS',
    products: [ 'ALL - TODOS' ]
  }

  // El producto elegido por el usuario
  selectedProduct: string = 'ALL - TODOS'

  // La fecha de inicio de la busqueda
  startDate: any = null
  
  // La fecha final de la busqueda
  endDate: any = null

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
  zones: Array<{
    name: string,
    products: Array<string>
  }> = [{
    name: 'ALL - TODAS',
    products: []
  }]

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
    private csvParser: PapaParseService,
    private modalManager: MzModalService
  ) {
  }

  // Esta funcion se ejecuta al iniciar la pagina
  ngOnInit(): void {
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
    /*this.file.info = this.csvParser.parse(this.file.info, {
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
    this.products = this.products.concat(products)*/

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

        // desplegamos el contenido del componente
        this.displayContent = true

        // notificamos al usuario que el archivo se leyo exitosamente
        this.toastManager.showText(
          this.langManager.messages.upload.success
        )

        // almacenamiento temporal para zonas y productos revisados
        let checkedZones = []
        let zones = []
        let products = []

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
            Date.parse(row['TSDone'].replace(/\s/g, ''))
          
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
        this.langManager.translations.es.global.datePickerConfig['min'] = 
        this.langManager.translations.en.global.datePickerConfig['min'] =
        this.startDate =
          new Date(this.minDate)
        
        this.langManager.translations.es.global.datePickerConfig['max'] = 
        this.langManager.translations.en.global.datePickerConfig['max'] =
        this.endDate =
          new Date(this.maxDate)

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
          zone.products.sort()
        }
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

  // Calcula el acumulado de productos para cada categoria registrada en el 
  // archivo leido
  computeTally(): void {
    // convertimos los limites de fecha a timestamps
    let minDate = Date.parse(this.startDate)
    let maxDate = Date.parse(this.endDate)

    // visitamos cada renglon del archivo
    for (let row of this.file.info.data) {
      // revisamos que los datos registrados en este renglon esten dentro del 
      // intervalo de fecha elegido por el usuario
      let date = Date.parse(row['TSDone'].replace(/\s/g, ''))
      if (date < minDate || date > maxDate) {
        continue
      }

      // si el usuario eligio una zona especifica, solo contabilizaremos los 
      // objetos registrados en esa zona
      if (this.selectedZone.name != 'ALL - TODAS') {
        if (row[this.chartsConfig.zoneKey] != this.selectedZone.name) {
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
          text: [],
          textposition: 'auto',
          hoverinfo: 'none',
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
          barTrace.text.push(Math.round(k.percentage))
        }

        // agregamos la grafica de barra resultante al arreglo de graficas
        this.chartsConfig.charts.push({
          data: [ barTrace ],
          layout: {
            width: 600,
            height: 360,
            title: c.name,
            // paper_bgcolor: '#d0d0d0',
            margin: {
              t: 80,
              b: 80
            },
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
        title: 'Pending',
        // paper_bgcolor: '#d0d0d0'
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

  // Esta funcion crea un archivo de imagen por cada grafica generada por el 
  // usuario 
  createChartBitmaps(): void {
    // numero de graficas desplegadas 
    let numCharts = 4

    // datos que seran enviados al servidor para crear el reporte PDF
    let reportData = {
      header: `
        <table class="header">
          <tr>
            <td>
              <b>${
                (localStorage.lang == 'en') ?
                  'From: ' : 'Del: '
              }</b>
              <span>${ this.startDate }</span>
              <b>${
                (localStorage.lang == 'en') ?
                  ' To: ' : ' Al: '
              }</b>
              <span>${ this.endDate }</span>
            </td>
            <td>
              <b>${
                (localStorage.lang == 'en') ?
                  'Zone: ' : 'Zona: '
              }</b>
              <span>${ this.selectedZone.name }</span>
            </td>
            <td>
              <b>${
                (localStorage.lang == 'en') ?
                  'Product: ' : 'Producto: '
              }</b>
              <span>${ this.selectedProduct }</span>
            </td>
          </tr>
        </table>
      `,
      body: `
        <table>
      `,
      footer: ''
    }

    // visitamos cada grafica generada
    for (let i = 0; i < numCharts; ++i) {
      // obtenemos el objeto DOM donde se almacena la grafica
      let chartDiv = document.getElementById(`chart${ i }`)

      // creamos la imagen
      Plotly.toImage(
        chartDiv,
        {
          format: 'png',
          width: 600,
          height: 360 
        }
      ).then((dataURL) => {
        // una vez que la imagen ha sido creada, obtenemos el indice de esta 
        // imagen
        let idx = i

        // agregamos la imagen al HTML a enviar al servidor
        reportData.body += (idx % 2 == 0) ?
          `<tr><td><img height="260px" src="${ dataURL }"></td>`
          : `<td><img height="260px" src="${ dataURL }"></td></tr>`

        // si es la ultima grafica a procesar ...
        if (idx == 3) {
          // cerramos el HTML y generamos la cadena JSON
          reportData.body += `</table>`
          this.reportForm.content = JSON.stringify([ reportData ])
        }
      }) // then((dataURL) => {}
    } // for (let i = 0; i < numCharts; ++i)
  } // createChartBitmaps(): void

  // Esta funcion se invoca cuando el usuario hace clic en el boton de graficar
  onGraphButtonClicked(): void {
    // reinicializamos los datos 
    this.chartsConfig.numItems = 0
    for (let c of this.chartsConfig.categories) {
      c.numItems = c.percentage = 0
      for (let k of c.keys) {
        k.numItems = k.percentage = 0
      }
    }

    // acumulamos el numero de productos por categoria y columna
    this.computeTally()

    // si no hubo ningun producto registrado con los parametros ingresados por 
    // el usuario, hay que notificarle
    if (this.chartsConfig.numItems == 0) {
      this.toastManager.showText(
        this.langManager.messages.graph.noResults
      )
      return 
    }

    // calculamos los porcentajes
    this.computePercentage()

    // desplegamos las graficas
    this.createChart()

    // creamos las imagenes que seran enviadas al servidor para generar el 
    // reporte PDF
    this.createChartBitmaps()

    // desplegamos el boton de reporte
    this.showReportButton = true
  } // onGraphButtonClicked(): void
} // export class GraphComponent implements OnInit