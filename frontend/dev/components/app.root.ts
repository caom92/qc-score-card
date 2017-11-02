// Importamos modulos externos necesarios para ejecutar la aplicacion
import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { UIRouterModule } from "@uirouter/angular"
import { MaterializeModule } from 'ng2-materialize'
import { FormsModule, ReactiveFormsModule }   from '@angular/forms'
import { HttpModule } from '@angular/http'

// Importamos los componentes de cada pagina de nuestra aplicacion
import { HomeComponent } from './app.home'
import { UploadComponent } from './app.upload'

// Importamos los componentes de los modales
import { ProgressModalComponent } from './modal.please.wait'

// Importamos los servicios que van a ser necesitados por cada pagina del 
// sistema
import { uiRouterAuthenticatedNavConfig } from '../functions/ui.router.authenticated.nav.config'
import { KeysPipe } from '../pipes/app.keys'
import { ClickStopPropagationDirective } from '../directives/app.stop.propagation'
import { DynamicComponentContainerDirective } from '../directives/dynamic.container'

import { GlobalElementsService } from '../services/app.globals'
import { BackendService } from '../services/app.backend'
import { LanguageService } from '../services/app.language'
import { ToastService } from '../services/app.toast'

// Declaramos el modulo raiz que indica el inicio de nuestra aplicacion
@NgModule({
  // declaramos los modulos globales que vamos a importar
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    BrowserAnimationsModule,
    MaterializeModule.forRoot(),
    UIRouterModule.forRoot({
      // hay que configurar ui-router para poder redireccionar al usuario 
      // dependiendo si la sesion esta iniciada o no
      // config: uiRouterAuthenticatedNavConfig,
      states: [
        {
          name: 'upload',
          url: '/upload',
          component: UploadComponent
        }
      ],
      useHash: true,
      otherwise: '/upload'
    })
  ],
  // declaramos los servicios globales
  providers: [
    GlobalElementsService,
    BackendService,
    ToastService,
    LanguageService
  ],
  // declaramos los componentes que va a utilizar nuestro sistema
  declarations: [
    ClickStopPropagationDirective,
    DynamicComponentContainerDirective,
    HomeComponent,
    KeysPipe,
    ProgressModalComponent,
    UploadComponent
  ],
  // declaramos cualquier componente que sera inyectado dinamicamente
  entryComponents: [
    ProgressModalComponent,
  ],
  // indicamos cual es el componente raiz
  bootstrap: [ HomeComponent ]
})
export class RootModule { 
  // Constructor del modulo raiz importa aquellos servicios que seran globales 
  // para todos los demas modulos
  constructor(
    private global: GlobalElementsService,
    private langManager: LanguageService
  ) {
  }
}
