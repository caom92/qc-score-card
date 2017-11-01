import {Directive, HostListener} from "@angular/core"

// Esta clase define una directiva que puede prevenir que el evento activado 
// por un clic no se propague a los manejadores mas profundos del componente 
// donde fue agregado
@Directive({
  selector: "[click-stop-propagation]"
})
export class ClickStopPropagationDirective
{
  // Esta funcion se ejecuta cuando el usuario hizo clic en el componente y 
  // bloquea la propagacion de dicho evento
  @HostListener("click", ["$event"])
  public onClick(event: any): void {
    event.stopPropagation()
  }
}