import { Component } from '@angular/core'
import { MzBaseModal, MzModalComponent } from 'ng2-materialize'
import { LanguageService } from '../services/app.language'

// El componente del modal que aparece para mostrar un icono de que se esta 
// cargando la pagina
@Component({
  templateUrl: '../templates/modal.please.wait.html'
})
export class ProgressModalComponent extends MzBaseModal 
{
  // Las opciones de configuracion del modal
  modalOptions = { 
    // el modal no se cerrara aunque el usuario haga clic fuera de el
    dismissible: false 
  }

  // Constructor del componente donde importaremos una instancia del servicio 
  // de idioma
  constructor(private langManager: LanguageService) {
    super() // invocamos el constructor de la clase padre
  }
}