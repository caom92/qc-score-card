import { FileParser } from './parser.default'
import { PapaParseService } from 'ngx-papaparse'

// Clase auxiliar que define los atributos necesarios para generar las graficas 
// leidos cada columna del archivo
export class ColumnKey 
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
export class Category extends ColumnKey
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

// Clase auxiliar para leer y procesar el archivo de vegetales o albahaca
export class ProductFileParser extends FileParser
{
  // Constructor de esta clase 
  constructor(
    filename: string,
    dateKey: string, 
    zoneKey: string, 
    productKey: string,
    csvParser: PapaParseService
  ) {
    // designamos el nombre del archivo y de las columnas de fecha, zona y 
    // producto
    super(filename, dateKey, zoneKey, productKey, csvParser)

    // inicializamos los datos iniciales para calcular el porcentaje de producto por categoria de riesgo
    this.chartData = {
      numItems: 0,
      categories: [
        new Category('No Defects Found', 'rgb(0, 153, 0)'),
        new Category('Quality', 'rgb(255, 255, 0)'),
        new Category('Conditional', 'rgb(255, 128, 0)'),
        new Category('Serious Conditional', 'rgb(255, 0, 0)')
      ]
    }
  }

  // Reinicia el acumulador de los datos de la grafica
  private resetChartData(): void {
    this.chartData.numItems = 0
    for (let category of this.chartData.categories) {
      for (let key of category.keys) {
        key.numItems = 0
        key.percentage = 0
      }
    }
  }

  // Calcula el acumulado de productos para cada categoria registrada en el 
  // archivo leido
  private computeTally(
    startDate: any,
    endDate: any,
    selectedZone: string, 
    selectedProduct: string
  ): void {
    this.chartData
    // convertimos los limites de fecha a timestamps
    let minDate = Date.parse(startDate)
    let maxDate = Date.parse(endDate)

    // visitamos cada renglon del archivo
    for (let row of this.data) {
      // revisamos que los datos registrados en este renglon esten dentro del 
      // intervalo de fecha elegido por el usuario
      let date = Date.parse(
        row[this.dateKey]
          .replace(/\s/g, '')
          .replace(/\//g,'-')
      )

      if (date < minDate || date > maxDate) {
        continue
      }

      // si el usuario eligio una zona especifica, solo contabilizaremos los 
      // objetos registrados en esa zona
      if (selectedZone != 'ALL - TODAS') {
        if (
          row[this.zoneKey].toUpperCase() 
          != selectedZone
        ) {
          continue
        }
      }

      // si el usuario eligio un producto especifico, solo contabilizaremos los 
      // objetos de ese tipo de producto
      if (selectedProduct != 'ALL - TODOS') {
        if (
          row[this.productKey].toUpperCase()
          != selectedProduct
        ) {
          continue
        }
      }

      // acumulamos el conteo total de objetos registrados; algunos archivos 
      // pueden tener cantidades escritas con una coma que divide las milesimas 
      // de las centecimas, estos numeros no son transformados automaticamente 
      // en tipo number, sino que permanecen como string, debemos considerar 
      // esto al leer las cantidades 
      this.chartData.numItems += 
        (typeof row['Itemcount'] === 'number') ?
          row['Itemcount']
          : parseFloat(row['Itemcount'].replace(/\,/g, ''))

      // visitamos cada categoria
      for (let c of this.chartData.categories) {
        // visitamos cada columna que esta asociada a esta categoria
        for (let k of c.keys) {
          // acumulamos el valor de esta columna, cuidando aquellos numeros 
          // que mencione anteriormente
          let numItems = (typeof row[k.name] === 'number') ?
            row[k.name]: parseFloat(row[k.name].replace(/\,/g, '')) 
          k.numItems += numItems
          c.numItems += numItems
        } // for (let j of this.chartsConfig.data.categories[i])
      } // for (let i of categories)
    } // for (let row of this.file.info.data)
  } // computeTally(): any

  // Calcula los valores porcentuales que ultimadamente seran desplegados en 
  // las graficas 
  private computePercentage(): void {
    // preparamos el porcentaje de los productos que no tuvieron defectos
    this.chartData.categories[0].percentage = 100

    // calculamos el divisor para calcular el porcentaje
    let totalNumItems = 100 / this.chartData.numItems

    // visitamos cada categoria que no sea aquella donde no se encontraron 
    // defectos
    for (let c of this.chartData.categories) {
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
        this.chartData.categories[0].percentage -= c.percentage
      } // if (c.name != 'No Defects Found')
    } // for (let c of this.chartsConfig.data.categories)
  } // computePercentage(): void

  // Procesa los datos del archivo en preparacion para crear la grafica
  protected computeChartData(
    startDate: any,
    endDate: any,
    selectedZone: string, 
    selectedProduct: string
  ): void {
    this.resetChartData()
    this.computeTally(startDate, endDate, selectedZone, selectedProduct)
    this.computePercentage()
  }

  // Crea las graficas a desplegar usando los datos computados previamente
  protected createCharts(chartDivs: Array<string>): void {
    // borramos las graficas anteriores
    this.charts = []
    
    // preparamos los datos de configuracion de la grafica de pastel
    let pieTrace = {
      values: [ this.data.categories[0].percentage ],
      labels: [ this.data.categories[0].name ],
      marker: { 
        colors: [ this.data.categories[0].color ] 
      },
      type: 'pie'
    }

    // visitamos cada categoria
    for (let c of this.data.categories) {
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
          // hoverinfo: 'none',
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
        this.charts.push({
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
    } // for (let c of this.chartsConfig.data.categories)

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
    for (let i = 0; i < this.charts.length; ++i) {
      Plotly.newPlot(
        chartDivs[i],
        this.charts[i].data,
        this.charts[i].layout,
        this.charts[i].options
      )
    } // for (let i = 0; i < this.charts.length; ++i)
  } // protected createCharts(chartDivs: Array<string>): void 
}