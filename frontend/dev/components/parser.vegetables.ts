import { ColumnKey, Category, ProductFileParser } from './parser.product'
import { PapaParseService } from 'ngx-papaparse'

// Clase auxiliar para leer y procesar el archivo de vegetales
export class VegetablesFileParser extends ProductFileParser
{
  // Constructor de esta clase 
  constructor(
    csvParser: PapaParseService
  ) {
    // designamos el nombre del archivo y de las columnas de fecha, zona y 
    // producto
    super('vegetables_latest', 'TSDone', 'Project', 'ItemCode', csvParser)

    // indicamos los nombres de las columnas que van a ser leidas para cada 
    // categoria de riesgo 

    // Quality
    this.chartData.categories[1].keys = [
      new ColumnKey('Undersized'),
      new ColumnKey('Oversized'),
      new ColumnKey('InsectDamage'),
      new ColumnKey('Scarring')
    ]

    // Conditional
    this.chartData.categories[2].keys = [
      new ColumnKey('Discoloration'),
      new ColumnKey('InsectPresenceFrass'),
      new ColumnKey('Softness'),
      new ColumnKey('Bruising')
    ]

    // Serious Conditional
    this.chartData.categories[3].keys = [
      new ColumnKey('Decay'),
      new ColumnKey('DehydrationShrivel'),
      new ColumnKey('AbnormalSoftness'),
      new ColumnKey('UnhealedCutsSplits')
    ]
  }
}