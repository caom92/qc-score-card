import { Component, ComponentFactoryResolver, ComponentRef } from '@angular/core'
import { ToastService } from '../services/app.toast'
import { GlobalElementsService } from '../services/app.globals'
import { LanguageService } from '../services/app.language'
import { StateService } from '@uirouter/angular'
import { DynamicComponentResolver } from './dynamic.resolver'
import { ScoresGraphComponent } from './graph.scores'
import { ComplaintsGraphComponent } from './graph.complaints'
import { environment } from '../environments/environment'
import { GraphComponent } from './graph.default'

// El tipo de documento que el usuario puede subir
export enum FileType {
  None,
  Vegetables,
  Basil,
  CustomerComplaints
}

// Este componente define el comportamiento de la pagina donde el usuario sube 
// un archivo para ser graficado 
@Component({
  templateUrl: '../templates/app.upload.html'
})
export class UploadComponent extends DynamicComponentResolver
{
  // El tipo de archivo que fue subido por el usuario
  selectedFileType: FileType = null

  // Instancia del componente que graficara los datos
  childComponent: ComponentRef<GraphComponent> = null

  // Lista de tipos de archivos a elegir
  types: Array<{
    id: FileType,
    name: string
  }> = [
    {
      id: FileType.Vegetables,
      name: 'Vegetales - Vegetables'
    },
    {
      id: FileType.Basil,
      name: 'Albahaca - Basil'
    },
    {
      id: FileType.CustomerComplaints,
      name: 'Quejas - Complaints'
    }
  ]

  // El constructor de este componente, inyectando los servicios requeridos
  constructor(
    private toastManager: ToastService,
    private global: GlobalElementsService,
    private langManager: LanguageService,
    private router: StateService,
    factoryResolver: ComponentFactoryResolver
  ) {
    // instanciamos el padre
    super(factoryResolver)
  }

  // Esta funcion se invoca cuando el usuario elije un tipo de archivo
  onDocTypeSelected(): void {
    // revisamos si una instancia del componente que grafica los datos habia 
    // sido creada previamente
    if (this.childComponent) {
      this.childComponent.destroy()
    }

    // dependiendo del tipo de archivo elegido, invocaremos un componente 
    // diferente para procesar los datos de dicho archivo
    let fileURL = (environment.production) ?  
      'http://score.jfdc.tech/files/'
      : 'http://localhost/qc-score/backend/'
    
    let component = null

    switch (this.selectedFileType) {
      case FileType.Vegetables:
        component = ScoresGraphComponent
        fileURL += 
          `vegetables_latest.${ (environment.production) ? 'csv' : 'php' }`
      break

      case FileType.Basil:
        component = ScoresGraphComponent
        fileURL +=
          `basil_latest.${ (environment.production) ? 'csv' : 'php' }`
      break

      case FileType.CustomerComplaints:
        component = ComplaintsGraphComponent
        fileURL +=
          `complaints_latest.${ (environment.production) ? 'csv' : 'php' }`
      break
    }

    // creamos la instancia al componente que graficara los datos
    this.childComponent = this.loadComponent(component, {
      file: {
        type: this.selectedFileType,
        info: fileURL
      }
    })
  } // onDocTypeSelected(): void
} // export class UploadComponent extends DynamicComponentResolver