import { Component, ViewContainerRef, ViewChild, ReflectiveInjector, ComponentFactoryResolver, Input } from '@angular/core';  

// El tipo de objeto que contiene la clase y los datos de entrada del 
// componente que sera inyectado
export type ComponentData = {
  component: any,
  inputs: any
}

// Este componente se utiliza para inyectar dinamicamente otros componentes
// dentro del componente padre de este componente
@Component({
  selector: 'dynamic-component',
  templateUrl: '../templates/app.dynamic.html'
})
export class DynamicComponent
{
  // Instancia al ultimo componente que fue inyectado
  currentComponent: any = null

  // Instancia del elemento que contiene la vista del ultimo componente 
  // inyectado
  @ViewChild(
    'dynamicComponentContainer', 
    { read: ViewContainerRef }
  ) 
  componentContainer: ViewContainerRef = null

  // Clase del componente a inyectar y los datos de entrada del mismo
  @Input()
  set componentData(data: ComponentData) {
    // si no se proporciono ningun dato de entrada, no inyectamos ningun 
    // componente 
    if (!data) {
      return
    }

    // formateamos los datos de entrada del componente para que sean 
    // entendibles por angular
    let inputProviders = Object.keys(data.inputs)
      .map((inputName) => {
        return {
          provide: inputName, 
          useValue: data.inputs[inputName]
        }
      })

    let resolvedInputs = ReflectiveInjector.resolve(inputProviders)

    // instanciamos el inyector usando los datos de entrada obtenidos y el 
    // inyector de este componente
    let injector = ReflectiveInjector.fromResolvedProviders(
      resolvedInputs, this.componentContainer.parentInjector
    )

    // instanciamos una fabrica para el componente que deseamos inyectar
    let factory = this.resolver.resolveComponentFactory(data.component)

    // instanciamos el componente usando la fabrica y el inyector
    let component = factory.create(injector)

    // insertamos el componente en el DOM del contenedor
    this.componentContainer.insert(component.hostView)

    // destruimos el componente creado inyectado
    if (this.currentComponent) {
      this.currentComponent.destroy()
    }

    // guardamos la instancia del componente inyectado
    this.currentComponent = component;
  }

  // El constructor de este componente, inyectando los servicios requeridos
  constructor(
    private resolver: ComponentFactoryResolver
  ) {
  }
}