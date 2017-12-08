import { Component, OnInit, Input } from '@angular/core'
import { ToastService } from '../services/app.toast'
import { GlobalElementsService } from '../services/app.globals'
import { LanguageService } from '../services/app.language'
import { StateService } from '@uirouter/angular'
import { FileType } from './app.upload'
import { PapaParseService } from 'ngx-papaparse'
import { MzModalService } from 'ng2-materialize'
import { ProgressModalComponent } from './modal.please.wait'
import { DateZoneProductCategoryGraphComponent, Category, ColumnKey } from './graph.date.zone.product.category'

// Este componente describe el comportamiento de la pantalla donde se 
// graficaran los datos del archivo
@Component({
  templateUrl: '../templates/graph.scores.html'
})
export class ScoresGraphComponent extends DateZoneProductCategoryGraphComponent
{
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
  onComponentInit(): void {
    this.chartsConfig.dateKey = 'TSDone'
    this.chartsConfig.categories = [
      new Category('No Defects Found', 'rgb(0, 153, 0)'),
      new Category('Quality', 'rgb(255, 255, 0)'),
      new Category('Conditional', 'rgb(255, 128, 0)'),
      new Category('Serious Conditional', 'rgb(255, 0, 0)')
    ]

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
        if (
          row[this.chartsConfig.zoneKey].toUpperCase() 
          != this.selectedZone.name
        ) {
          continue
        }
      }

      // si el usuario eligio un producto especifico, solo contabilizaremos los 
      // objetos de ese tipo de producto
      if (this.selectedProduct != 'ALL - TODOS') {
        if (
          row[this.chartsConfig.productKey].toUpperCase()
          != this.selectedProduct
        ) {
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
  initChart(): void {
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

    // calculamos los porcentajes a desplegar
    this.computePercentage()
  } 
} // export class GraphComponent implements OnInit