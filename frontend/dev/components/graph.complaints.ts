import { Component, OnInit, Input } from '@angular/core'
import { ToastService } from '../services/app.toast'
import { GlobalElementsService } from '../services/app.globals'
import { LanguageService } from '../services/app.language'
import { StateService } from '@uirouter/angular'
import { FileType } from './app.upload'
import { PapaParseService } from 'ngx-papaparse'
import { MzModalService } from 'ng2-materialize'
import { ProgressModalComponent } from './modal.please.wait'
import { DateZoneProductCategoryGraphComponent } from './graph.date.zone.product.category'

// Clase auxiliar para las categorias de quejas
class Category 
{
  sumQuantity: number = 0
  sumAffected: number = 0
  name: string = null
}

// Clase auxiliar para los estados de producto
class Status 
{
  name: string = null
  checkedCategories: Array<string> = []
  categories: Array<Category> = []
}

// Este componente describe el comportamiento de la pantalla donde se 
// graficaran los datos del archivo
@Component({
  templateUrl: '../templates/graph.complaints.html'
})
export class ComplaintsGraphComponent 
  extends DateZoneProductCategoryGraphComponent
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
    this.chartsConfig.zoneKey = 'Project'
    this.chartsConfig.productKey = 'ItemCode'
    this.chartsConfig.dateKey = 'DateRecv'
  }

  // Crea las graficas en pantalla
  createChart(): void {
    // borramos la información de las gráficas creadas anteriormente
    this.chartsConfig.charts = []

    let idx = 0
    for (let status of this.chartsConfig.data) {
      let quantityTrace = {
        type: 'bar',
        orientation: 'h',
        name: 'Quantity',
        textposition: 'auto',
        text: [],
        y: [],
        x: []
      }
      
      let affectedTrace = {
        type: 'bar',
        orientation: 'h',
        name: 'Affected',
        textposition: 'auto',
        text: [],
        y: [],
        x: []
      }

      for (let category of status.categories) {
        quantityTrace.y.push(category.name)
        quantityTrace.x.push(category.sumQuantity)
        quantityTrace.text.push(
          (category.sumQuantity > 1000) ?
            `${ Math.round(0.001 * category.sumQuantity) }K`
            : category.sumQuantity
        )
        affectedTrace.y.push(category.name)
        affectedTrace.x.push(category.sumAffected)
        affectedTrace.text.push(
          (category.sumAffected > 1000) ?
            `${ Math.round(0.001 * category.sumAffected) }K`
            : category.sumAffected
        )
      }

      this.chartsConfig.charts.push({
        data: [ quantityTrace, affectedTrace ],
        layout: {
          title: status.name,
          barmode: 'group',
          legend: {
            orientation: 'h'
          },
          margin: {
            l: 200
          }
        },
        options: {}
      })

      Plotly.newPlot(
        `chart${ idx }`,
        this.chartsConfig.charts[idx].data,
        this.chartsConfig.charts[idx].layout,
        this.chartsConfig.charts[idx++].options
      )
    }
  }
  
  // Esta funcion crea un archivo de imagen por cada grafica generada por el 
  // usuario 
  createChartBitmaps(): void {
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
      body: ``,
      footer: ''
    }

    for (let i = 0; i < this.chartsConfig.charts.length; ++i) {
      Plotly.toImage(
        document.getElementById(`chart${ i }`),
        {
          format: 'png',
          width: 960,
          height: 576
        }
      ).then((dataURL) => {
        let idx = i

        reportData.body +=
          `<img src="${ dataURL }"><br>`
        
        if (idx == this.chartsConfig.charts.length - 1) {
          this.reportForm.content = JSON.stringify([ reportData ])
        }
      })
    }
  }

  initChart(): void {
    // convertimos los limites de fecha a timestamps
    let minDate = Date.parse(this.startDate)
    let maxDate = Date.parse(this.endDate)

    let checkedStatuses: Array<string> = []
    let statuses: Array<Status> = []

    // visitamos cada renglon del archivo
    for (let row of this.file.info.data) {
      // revisamos que los datos registrados en este renglon esten dentro del 
      // intervalo de fecha elegido por el usuario
      let date = Date.parse(row[this.chartsConfig.dateKey].replace(/\s/g, ''))
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

      let status = row['Status'].toUpperCase()
      let categories = [
        row['Complaint Category 1'].toUpperCase(),
        row['Complaint Category 2'].toUpperCase(),
        row['Complaint Category 3'].toUpperCase()
      ]
      let quantity = (typeof row['Quantity'] === 'number') ?
        row['Quantity']
        : parseFloat(row['Quantity'].replace(/\,/g, ''))
      let affected = (typeof row['Affected'] === 'number') ?
        row['Affected']
        : parseFloat(row['Affected'].replace(/\,/g, ''))

      for (let category of categories) {
        if (category.length == 0) {
          category = '(S/N)'
        }

        let idx = checkedStatuses.indexOf(status)
        if (idx > -1) {
          let c = statuses[idx].checkedCategories.indexOf(category)
          if (c > -1) {
            statuses[idx].categories[c].sumQuantity += quantity
            statuses[idx].categories[c].sumAffected += affected              
          } else {
            statuses[idx].checkedCategories.push(category)
            statuses[idx].categories.push({
              sumQuantity: quantity,
              sumAffected: affected,
              name: category
            })
          }
        } else {
          checkedStatuses.push(status)
          statuses.push({
            name: status,
            checkedCategories: [
              category
            ],
            categories: [{
              sumQuantity: quantity,
              sumAffected: affected,
              name: category
            }]
          })
        }
      } // for (let category of categories)
    } // for (let row of this.file.info.data)

    this.chartsConfig.data = statuses

    if (this.chartsConfig.data.length == 0) {
      this.toastManager.showText(
        this.langManager.messages.graph.noResults
      )
    }
  } // initChart(): void 
} // export class ComplaintsGraphComponent 