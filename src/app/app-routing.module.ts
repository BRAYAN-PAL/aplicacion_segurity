import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './guards/admin-guard';
import { NoAuthGuard } from './guards/no-auth-guard';
import { WorkerGuard } from './guards/worker-guard';

const routes: Routes = [

  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },

  {
    path: 'auth',
    loadChildren: () =>
      import('./pages/auth/auth.module')
      .then(m => m.AuthPageModule),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'tabs',
    loadChildren: () =>
      import('./pages/main/main.module')
      .then(m => m.MainPageModule),
    canActivate: [AdminGuard]
  },
  {
    path: 'trabajador',
    loadChildren: () =>
      import('./pages/trabajador/tabs/tabs.module')
      .then(m => m.TrabajadorTabsPageModule),
    canActivate: [WorkerGuard]
  },
  
  {
    path: 'notificaciones',
    loadChildren: () =>
      import('./pages/trabajador/notificaciones/notificaciones.module')
      .then(m => m.NotificacionesPageModule)
  },
  {
    path: 'perfil',
    loadChildren: () =>
      import('./pages/perfil/perfil.module')
      .then(m => m.PerfilPageModule)
  },
  {
    path: 'terminos',
    loadChildren: () =>
      import('./pages/terminos/terminos.module')
      .then(m => m.TerminosPageModule)
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes,
      { preloadingStrategy: PreloadAllModules }
    )
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }