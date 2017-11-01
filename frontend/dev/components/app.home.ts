import { Component, OnInit } from '@angular/core'
import { BackendService } from '../services/app.backend'
import { ToastService } from '../services/app.toast'
import { StateService } from '@uirouter/angular'
import { GlobalElementsService } from '../services/app.globals'
import { LanguageService } from '../services/app.language'

// Componente que define el comportamiento de la pagina de inicio
@Component({
  selector: 'app-root',
  templateUrl: '../templates/app.home.html',
})
export class HomeComponent implements OnInit
{ 
  // El constructor de este componente, inyectando los servicios requeridos
  constructor(
    private server: BackendService,
    private toastManager: ToastService,
    private router: StateService,
    private global: GlobalElementsService,
    private langManager: LanguageService
  ) {
  }

  // Esta funcion se ejecuta al iniciar la pagina
  ngOnInit(): void {
  } // ngOnInit()
} // export class HomeComponent implements OnInit
