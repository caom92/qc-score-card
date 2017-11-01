import { ViewChild, ComponentFactoryResolver, Type } from '@angular/core'
import { DynamicComponentContainerDirective } from '../directives/dynamic.container'

// Esta clase define la funcionalidad necesaria para que un componente pueda 
// inyectar dinamicamente componentes en su vista 
export class DynamicComponentResolver
{
  // Instancia de la interfaz a la vista del contenedor que poseera la 
  // instancia del componente inyectado
  @ViewChild(DynamicComponentContainerDirective) 
  container: DynamicComponentContainerDirective

  // El constructor de este componente, inyectando los servicios requeridos
  constructor(
    private factoryResolver: ComponentFactoryResolver
  ) {
  }

  // Esta funcion inyecta un componente en el contenedor
  // [in]   component: la clase que define el componente que sera inyectado
  // [in]   data: los datos de entrada que el componente espera recibir al ser 
  //        creado
  // [out]  return: la instancia al componente creado 
  loadComponent(component: Type<any>, data: any): any {
    // primero instanciamos una fabrica para el componente a inyectar
    let factory = this.factoryResolver.resolveComponentFactory(component)

    // obtenemos la instancia a la vista del contenedor
    let viewContainer = this.container.viewContainer

    // limpiamos el contenido actual del contenedor
    viewContainer.clear()

    // instanciamos el componente
    let componentInstance = viewContainer.createComponent(factory)
    
    // le pasamos los datos de entrada que esta esperando recibir
    for (let i in data) {
      componentInstance.instance[i] = data[i]
    }

    // returnamos la instancia obtenida
    return componentInstance
  }
}