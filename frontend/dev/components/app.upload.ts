import { Component, ComponentFactoryResolver, ComponentRef } from '@angular/core'
import { ToastService } from '../services/app.toast'
import { GlobalElementsService } from '../services/app.globals'
import { LanguageService } from '../services/app.language'
import { StateService } from '@uirouter/angular'
import { DynamicComponentResolver } from './dynamic.resolver'
import { ScoresGraphComponent } from './graph.scores'
import { environment } from '../environments/environment'
import { GraphComponent } from './graph'

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
  selectedFileType: FileType = FileType.Vegetables

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

  onDocTypeSelected(): void {
    // revisamos si una instancia del componente que grafica los datos habia 
    // sido creada previamente
    if (this.childComponent) {
      this.childComponent.destroy()
    }

    let fileURL = null
    switch (this.selectedFileType) {
      case FileType.Vegetables:
        fileURL = (environment.production) ?  
          'http://score.jfdc.tech/files/vegetables_latest.csv'
          : 'http://localhost/qc-score/backend/vegetables_latest.php'
        
        // creamos la instancia al componente que graficara los datos
        this.childComponent = this.loadComponent(ScoresGraphComponent, {
          file: {
            type: this.selectedFileType,
            info: fileURL
          }
        })
      break

      case FileType.Basil:
        fileURL = (environment.production) ?
          'http://score.jfdc.tech/files/basil_latest.csv'
          : 'http://localhost/qc-score/backend/basil_latest.php'

        // creamos la instancia al componente que graficara los datos
        this.childComponent = this.loadComponent(ScoresGraphComponent, {
          file: {
            type: this.selectedFileType,
            info: fileURL
          }
        })
      break
    }
  }
}