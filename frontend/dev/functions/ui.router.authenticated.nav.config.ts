import { Injector } from '@angular/core'
import { UIRouter, Transition } from "@uirouter/angular"

export function uiRouterAuthenticatedNavConfig(
  router: UIRouter, 
  injector: Injector
) {
  // ui-router tiene un mecanismo que nos permite ejecutar codigo cuando 
  // se cambia de un estado a otro, en este caso, onStart se ejecuta 
  // despues de salir del estado anterior y antes de entrar al estado 
  // siguiente, el detalle con esta funcion es que siempre debe retornar 
  // ya sea un booleano que indique si la navegacion al sig. se debe 
  // llevar a cabo o se debe detener, o una instancia del estado al cual 
  // se va a redireccionar el usuario; debido a esto, la funcion debe 
  // ejecutarse de forma sincrona, lo que es incompatible con la interfaz 
  // HTTP que podemos utilizar para revisar el cookie de sesion en el 
  // servidor. Debido a esto y al hecho de que, de hacerlo asi, se 
  // revisaria el cookie de sesion cada que se navega a una nueva pagina, 
  // no revisamos el cookie de sesion en esta funcion y en cambio 
  // revisamos una variable local
  router.transitionService.onStart(
    // activamos el callback de transferencia cuando se navega a 
    // cualquier estado
    { to: '*' },
    function(transition: Transition) {
      // obtenemos una instancia del servicio que maneja los estados, 
      // ademas de una copia del estado anterior y una del estado 
      // siguiente
      const stateService = transition.router.stateService
      let from = transition.$from()
      let to = transition.$to()

      // iniciamos ciertas banderas que nos diran de donde viene y a 
      // donde va el usuario
      let isComingFromOutside = from.name.length == 0
      let isComingFromLogIn = from.name == 'login'
      let isGoingToLogIn = to.name == 'login'

      // una funcion que revisa si el usuario ya inicio sesion o no
      let isLoggedIn = () => {
        return (
          localStorage.is_logged_in !== undefined 
          && localStorage.is_logged_in !== 'false'
        )
      }

      // si el usuario viene de fuera y quiere entrar a cualquier otra pagina 
      // que no sea la de login, hay que revisar si el usuario inicio sesion
      if (!isComingFromOutside && !isGoingToLogIn) {
        return (isLoggedIn()) ? true : stateService.target('login')
      }

      // en cualquier otro caso, permitimos la navegacion
      return true
    }  
  )
}