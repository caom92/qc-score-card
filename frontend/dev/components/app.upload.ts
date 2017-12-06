import { Component, ComponentFactoryResolver, ComponentRef } from '@angular/core'
import { ToastService } from '../services/app.toast'
import { GlobalElementsService } from '../services/app.globals'
import { LanguageService } from '../services/app.language'
import { StateService } from '@uirouter/angular'
import { DynamicComponentResolver } from './dynamic.resolver'
import { GraphComponent } from './app.graph'
import { environment } from '../environments/environment'

// El tipo de documento que el usuario puede subir
export enum FileType {
  None,
  Vegetables,
  Basil
}

// Este componente define el comportamiento de la pagina donde el usuario sube 
// un archivo para ser graficado 
@Component({
  templateUrl: '../templates/app.upload.html'
})
export class UploadComponent extends DynamicComponentResolver
{
  // Bandera que indica si el formulario de captura es válido o no
  // isFormValid: boolean = false

  // El tipo de archivo que fue subido por el usuario
  selectedFileType: FileType = FileType.Vegetables

  // Interfaz que leera los contenidos del archivo
  // fileReader: FileReader = null

  // Instancia del componente que graficara los datos
  childComponent: ComponentRef<GraphComponent> = null

  // El archivo elegido por el usuario
  // selectedFile: any = null

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

    /*
    // instanciamos el lector de archivos
    this.fileReader = new FileReader()
    
    // preparamos el callback a invocar cuando el archivo haya sido cargado
    this.fileReader.onload = () => {
      
      // notificamos al usuario que el archivo se leyo exitosamente
      this.toastManager.showText(
        this.langManager.messages.upload.success
      )

      // revisamos si una instancia del componente que grafica los datos habia 
      // sido creada previamente
      if (this.childComponent) {
        this.childComponent.destroy()
      }

      // creamos la instancia al componente que graficara los datos
      this.childComponent = this.loadComponent(GraphComponent, {
        file: {
          type: this.selectedFileType,
          info: this.fileReader.result
        }
      })
    }
    */
  }

  // Esta funcion se invoca cuando el usuario elije un archivo de su 
  // computadora para ser leido
  /*onFileSelected(event: any): void {
    // primero obtenemos una instancia del archivo
    let file = event.target.files[0]

    // revisamos si es un archivo CSV
    if (file.type != 'text/csv' && file.type != 'application/vnd.ms-excel') {
      // si no lo es, notificamos al usuario 
      this.toastManager.showText(
        this.langManager.messages.upload.fileTypeError
      )

      // apagamos la bandera que indica si el formulario es valido
      this.isFormValid = false
      return
    }

    // si el archivo es del formato correcto, lo guardamos para usarlo más 
    // adelante
    this.selectedFile = file

    // encendimos la bandera que indica que el formulario es valido
    this.isFormValid = true
  }

  // Esta funcion se invoca cuando el usuario hace clic en el boton de enviar 
  // del formulario
  onFileUploaded(): void {
    // leemos el archivo
    this.fileReader.readAsText(this.selectedFile)
  }*/

  onDocTypeSelected(): void {
    let fileURL = null
    switch (this.selectedFileType) {
      case FileType.Vegetables:
        fileURL = (environment.production) ?  
          'http://score.jfdc.tech/files/vegetables_latest.csv'
          : 'http://localhost/qc-score/backend/vegetables_latest.php'
      break

      case FileType.Basil:
        fileURL = (environment.production) ?
          'http://score.jfdc.tech/files/basil_latest.csv'
          : 'http://localhost/qc-score/backend/basil_latest.php'
      break
    }

    // revisamos si una instancia del componente que grafica los datos habia 
    // sido creada previamente
    if (this.childComponent) {
      this.childComponent.destroy()
    }

    // creamos la instancia al componente que graficara los datos
    this.childComponent = this.loadComponent(GraphComponent, {
      file: {
        type: this.selectedFileType,
        info: fileURL
      }
    })
  }
}