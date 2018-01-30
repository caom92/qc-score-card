import { ColumnKey, Category, ProductFileParser } from './parser.product'
import { PapaParseService } from 'ngx-papaparse'

// Clase auxiliar para leer y procesar el archivo de albahaca
export class BasilFileParser extends ProductFileParser
{
  // Constructor de esta clase 
  constructor(
    csvParser: PapaParseService
  ) {
    // designamos el nombre del archivo y de las columnas de fecha, zona y 
    // producto
    super('basil_latest', 'TSDone', 'CardCode', 'ItemCode', csvParser)

    // indicamos los nombres de las columnas que van a ser leidas para cada 
    // categoria de riesgo 

    // Quality
    this.chartData.categories[1].keys = [
      new ColumnKey('Undersized%'),
      new ColumnKey('Oversized%'),
      new ColumnKey('InsectDamage%'),
      new ColumnKey('Flowers%')
    ]

    // Conditional
    this.chartData.categories[2].keys = [
      new ColumnKey('Discoloration%'),
      new ColumnKey('SevereInsectFrass%'),
      new ColumnKey('MechanicalDamage%')
    ]

    // Serious conditional
    this.chartData.categories[3].keys = [
      new ColumnKey('Dehydration%'),
      new ColumnKey('Decay%'),
      new ColumnKey('Yellowing%'),
      new ColumnKey('Wetness%'),
      new ColumnKey('DiseasePresence%')
    ]
  }
}