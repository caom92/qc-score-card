import { FileParser } from './parser.default'
import { PapaParseService } from 'ngx-papaparse'

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
  categories: Array<Category> = []
}

// Clase auxiliar para leer y procesar el archivo de quejas
export class ComplaintsFileParser extends FileParser
{
  // Constructor de esta clase 
  constructor(
    csvParser: PapaParseService
  ) {
    // designamos el nombre del archivo y de las columnas de fecha, zona y 
    // producto
    super('complaints_latest', 'DateRecv', 'Project', 'ItemCode', csvParser)
  }

  // Procesa los datos del archivo en preparacion para crear la grafica
  protected computeChartData(
    startDate: any,
    endDate: any,
    selectedZone: string, 
    selectedProduct: string
  ): void {
    // convertimos los limites de fecha a timestamps
    let minDate = Date.parse(startDate)
    let maxDate = Date.parse(endDate)

    // almacenamiento auxiliar para procesar los datos leidos del archivo
    let statuses: Array<Status> = []

    // visitamos cada renglon del archivo
    for (let row of this.data) {
      // revisamos que los datos registrados en este renglon esten dentro del 
      // intervalo de fecha elegido por el usuario
      let date = Date.parse(
        row[this.dateKey]
          .replace(/\s/g, '')
          .replace(/\//g, '-')
      )
      if (date < minDate || date > maxDate) {
        continue
      }

      // si el usuario eligio una zona especifica, solo contabilizaremos los 
      // objetos registrados en esa zona
      if (selectedZone != 'ALL - TODAS') {
        if (row[this.zoneKey].toUpperCase() != selectedZone) {
          continue
        }
      }

      // si el usuario eligio un producto especifico, solo contabilizaremos los 
      // objetos de ese tipo de producto
      if (selectedProduct != 'ALL - TODOS') {
        if (row[this.productKey].toUpperCase() != selectedProduct) {
          continue
        }
      }

      // convertimos los nombres de los estados y las categorias a mayusculas
      let status = row['Status'].toUpperCase()
      let categories = [
        row['Complaint Category 1'].toUpperCase(),
        row['Complaint Category 2'].toUpperCase(),
        row['Complaint Category 3'].toUpperCase()
      ]

      // tambien es necesario convertir los valores de las cantidades y num. de 
      // afectdos a numeros con el formato apropiado
      let quantity = (typeof row['Quantity'] === 'number') ?
        row['Quantity']
        : parseFloat(row['Quantity'].replace(/\,/g, ''))
      let affected = (typeof row['Affected'] === 'number') ?
        row['Affected']
        : parseFloat(row['Affected'].replace(/\,/g, ''))

      // visitamos cada categoria 
      for (let category of categories) {
        // si no tiene nombre, le asignamos uno
        if (category.length == 0) {
          category = '(S/N)'
        }

        // revisamos si el estado ya habia sido procesado
        let idx = statuses.findIndex((x) => x.name == status)
        if (idx > -1) {
          // si ya fue procesado, revisamos si la categoria se encuentra 
          // almacenada en este estado
          let c = statuses[idx].categories.findIndex((x) => x.name == category)
          if (c > -1) {
            // si se encuentra almacenada, acumulamos los contadores de esa 
            // categoria
            statuses[idx].categories[c].sumQuantity += quantity
            statuses[idx].categories[c].sumAffected += affected              
          } else {
            // si la categoria no se encuentra almacenada en el estado, lo 
            // agregamos junto con los valores iniciales de cantidad y afectados
            statuses[idx].categories.push({
              sumQuantity: quantity,
              sumAffected: affected,
              name: category
            })
          }
        } else {
          // si el estado no ha sido procesado, lo agregamos junto con la 
          // categoria
          statuses.push({
            name: status,
            categories: [{
              sumQuantity: quantity,
              sumAffected: affected,
              name: category
            }]
          })
        } // if (idx > -1)
      } // for (let category of categories)
    } // for (let row of this.file.info.data)

    // una vez procesados los datos, los almacenamos para crear la grafica 
    // despues
    this.chartData = statuses

    // si no se obtuvieron datos, notificamos al usuario
    if (this.chartData.length == 0) {
      throw 'No elements found with given search parameters'
    }
  } // computeChartData()

  // Crea las graficas a desplegar usando los datos computados previamente
  protected createCharts(chartDivs: Array<string>): void {
    // borramos la información de las gráficas creadas anteriormente
    this.charts = []

    // indice para navegar el arreglo de las graficas generadas
    let idx = 0

    // visitamos cada estado computado previamente
    for (let status of this.chartData) {
      // inicializamos la configuracion para cada tipo de valores a representar 
      // en las graficas 
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

      // visitamos cada categoria perteneciente al estado actual
      for (let category of status.categories) {
        // acumulamos los nombres de cada categoria en el eje vertical
        quantityTrace.y.push(category.name)

        // y los valores en el eje horizontal
        quantityTrace.x.push(category.sumQuantity)

        // y el texto a desplegar en la grafica sera el valor redondeado
        quantityTrace.text.push(
          (category.sumQuantity > 1000) ?
            `${ Math.round(0.001 * category.sumQuantity) }K`
            : category.sumQuantity
        )

        // hacemos lo mismo con el conteo de afectados
        affectedTrace.y.push(category.name)
        affectedTrace.x.push(category.sumAffected)
        affectedTrace.text.push(
          (category.sumAffected > 1000) ?
            `${ Math.round(0.001 * category.sumAffected) }K`
            : category.sumAffected
        )
      }

      // despues de acumular todos los valores, los agregamos a la 
      // configuracion final de la grafica y guardamos dicha configuracion y 
      // los datos para su uso futuro
      this.charts.push({
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

      // graficamos los resultados obtenidos
      Plotly.newPlot(
        chartDivs[idx],
        this.charts[idx].data,
        this.charts[idx].layout,
        this.charts[idx++].options
      )
    } // for (let category of status.categories)
  } // for (let status of this.chartData)
} // export class ComplaintsFileParser extends FileParser