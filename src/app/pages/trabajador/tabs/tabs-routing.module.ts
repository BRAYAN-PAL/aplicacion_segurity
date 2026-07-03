import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrabajadorTabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TrabajadorTabsPage,
    children: [
      {
        path: 'inicio',
        loadChildren: () =>
          import('../inicio/inicio.module').then(m => m.InicioPageModule)
      },
      {
        path: 'horario',
        loadChildren: () =>
          import('../horario/horario.module').then(m => m.HorarioPageModule)
      },
      {
        path: 'asistencia',
        loadChildren: () =>
          import('../asistencia/asistencia.module').then(m => m.AsistenciaTrabajadorPageModule)
      },
      {
        path: 'notificaciones',
        loadChildren: () => import('../notificaciones/notificaciones.module').then(m => m.NotificacionesPageModule)
      },
      {
        path: 'solicitudes',
        loadChildren: () =>
          import('../solicitudes/solicitudes.module').then(m => m.SolicitudesPageModule)
      },
      {
        path: '',
        redirectTo: '/trabajador/inicio',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TrabajadorTabsRoutingModule {}
