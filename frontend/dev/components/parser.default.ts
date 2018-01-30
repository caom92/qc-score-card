import { FileType } from './app.scores'
import { PapaParseService } from 'ngx-papaparse'
import { environment } from '../environments/environment'

// Clase auxiliar que define los atributos asociados con una zona 
export class Zone
{
  name: string
  products: Array<string>
}

// Clase auxiliar que contiene los metodos minimos necesarios para leer el 
// contenido de un archivo CSV, almacenar sus datos, procesarlos y generar una 
// grafica segun las reglas de negocio
export abstract class FileParser
{
  // Limite inferior para elegir una fecha para graficar
  _minDate: number = Number.MAX_SAFE_INTEGER
  get minDate(): number {
    return this._minDate
  }
  
  // Limite superior para elegir una fecha para graficar 
  _maxDate: number = 0
  get maxDate(): number {
    return this._maxDate
  }

  // Las zonas registradas en el archivo
  _zones: Array<Zone> = []
  get zones(): Array<Zone> {
    return this._zones
  }

  // Los productos registrados en el archivo
  _products: Array<string> = []
  get products(): Array<string> {
    return this._products
  }

  // Los datos necesarios para crear la grafica
  protected chartData: any = null

  // Los datos de las graficas
  protected charts: Array<any> = []

  // Los datos leidos del archivo
  protected data: any

  // El constructor de esta clase, inyectando el servicio que leera el archivo 
  // CSV y el nombre de dicho archivo
  constructor(
    private filename: string,
    protected dateKey: string, 
    protected zoneKey: string, 
    protected productKey: string,
    private csvParser: PapaParseService
  ) {
  }

  // Lee el archivo CSV y almacena los datos obtenidos de este cuando termina
  read(
    onComplete: () => void,
    onError: (error: any, file: any) => void =
      (error: any, file: any) => {
        console.log(error)
      }
  ) {
    this.csvParser.parse(
      (environment.production) ?
        `http://score.jfdc.tech/files/${ this.filename }.csv`
        : `http://localhost/qc-score/backend/${ this.filename }.php`, {
      delimiter: ',',
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      download: true,
      complete: (results: any, file: any) => {
        // guardamos los datos leidos del archivo
        this.data = results.data

        // visitamos cada renglon del archivo
        for (let row of this.data) {
          // almacenamiento temporal para la zona y el producto del archivo
          let zone = row[this.zoneKey].toUpperCase()
          let product = row[this.productKey].toUpperCase()

          // revisamos si la zona ya fue capturada
          let i = this._zones.findIndex((element) => element.name == zone)
          if (i > -1) {
            // si ya lo fue, revisamos si el producto ya fue capturado dentro 
            // de esa zona
            let p = this._zones[i].products.indexOf(product)
            if (p == -1) {
              // si el producto no fue capturado, lo agregamos a la zona
              this._zones[i].products.push(product)
            }
          } else {
            // si la zona no ha sido capturada, la agregamos junto con el 
            // producto
            this._zones.push({
              name: zone,
              products: [ product ]
            })
          }

          // revisamos si el producto ya fue agregado
          i = this._products.indexOf(product)
          if (i == -1) {
            // si no ha sido capturado, lo agregamos
            this._products.push(product)
          }

          // obtenemos la fecha de este registro
          let date = 
            Date.parse(row[this.dateKey].replace(/\s/g, ''))
          
          // si la fecha es mas chica que el limite inferior, la almacenamos 
          // como el nuevo limite inferior
          if (date < this.minDate) {
            this._minDate = date
          }

          // si la fecha es mas grande que el limite superior, la almacenamos
          // como el nuevo limite superior
          if (date > this.maxDate) {
            this._maxDate = date
          }
        } // for (let row of results)

        // ordenamos los productos y las zonas por nombre
        this._products.sort()
        this._zones.sort((a: Zone, b: Zone) => 
          (a.name == b.name) ? 0 : (a.name < b.name) ? -1 : 1
        )
        for (let zone of this._zones) {
          zone.products.sort()
        }

        // invocamos la funcion que contiene las operaciones especificas a 
        // ejecutar si el archivo se leyo exitosamente
        onComplete()
      },
      error: (error, file) => onError
    })
  }

  // Procesa los datos del archivo en preparacion para crear la grafica
  protected abstract computeChartData(
    startDate: any,
    endDate: any,
    selectedZone: string, 
    selectedProduct: string
  ): void

  // Crea las graficas a desplegar usando los datos computados previamente
  protected abstract createCharts(chartDivs: Array<string>): void

  // Crea las graficas y su respectivo reporte
  createChartsAndReport(
    startDate: any,
    endDate: any,
    selectedZone: string, 
    selectedProduct: string,
    chartDivs: Array<string>
  ): void {
    this.computeChartData(
      startDate,
      endDate,
      selectedZone,
      selectedProduct
    )
    console.log(this.chartData)
    //this.createCharts(chartDivs)
  }
}