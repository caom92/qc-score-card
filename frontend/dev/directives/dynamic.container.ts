import { Directive, ViewContainerRef } from '@angular/core';

// Diractiva que define el componente que la posea como el contenedor de un 
// componente que sera inyectado dinamicamente
@Directive({
  selector: '[dynamicComponentContainer]',
})
export class DynamicComponentContainerDirective {
  // El constructor inyectando los servicios requeridos
  constructor(
    public viewContainer: ViewContainerRef
  ) {
  }
}