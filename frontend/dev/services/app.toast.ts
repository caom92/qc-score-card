import { Injectable } from '@angular/core'
import { MzToastService } from 'ng2-materialize'

// Servicio que despliega mensajes en la pantalla para informar al usuario 
// sobre los resultados que sus acciones tuvieron
@Injectable()
export class ToastService
{
  // El constructor de este servicio
  // hacemos uso del servicio de materialize para desplegar toasts
  constructor(private toastService: MzToastService) {
  }

  // Despliegue el texto descrito en un toast
  // [in]   text: el texto a desplegar en el toast
  showText(text: string): void {
    this.toastService.show(text, 3500, 'rounded')
  }
}