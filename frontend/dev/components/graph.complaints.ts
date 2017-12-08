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
  }
  
  // Esta funcion crea un archivo de imagen por cada grafica generada por el 
  // usuario 
  createChartBitmaps(): void {
  }

  initChart(): void {
  }
}