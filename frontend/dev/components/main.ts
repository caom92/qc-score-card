// Importamos las clases de Angular necesarias para ejecutar la aplicacion
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// Importamos nuestra variable global que indica si el ambiente es de desarrollo
// o produccion
import { environment } from '../environments/environment';

// Importamos el modulo raiz de nuestra aplicacion
import { RootModule } from '../components/app.root';

// Activamos el modo de produccion si este fue el modo solicitado
if (environment.production) {
  enableProdMode()
}

// Iniciamos la ejecucion de la aplicacion
platformBrowserDynamic().bootstrapModule(RootModule)