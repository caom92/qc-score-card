// Código obtenido del sig. sitio, creditos al autor original
// https://damienbod.com/2016/04/21/creating-an-angular-2-component-for-plotly/

import { Component, OnInit, Input } from "@angular/core"

@Component({
  selector: 'plotlychart',
  template: `<div id="chart-area"></div>`
})
export class PlotlyComponent implements OnInit
{
  @Input() 
  data: any = null

  @Input() 
  layout: any = null

  @Input() 
  options: any = null

  ngOnInit() {
    Plotly.newPlot('chart-area', this.data, this.layout, this.options)
  }
}