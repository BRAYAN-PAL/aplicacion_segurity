import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [

      {
        path: 'home',
        loadChildren: () =>
          import('../main/home/home.module')
          .then(m => m.HomePageModule)
      },

      {
        path: 'turnos',
        loadChildren: () =>
          import('../main/turnos/turnos.module')
          .then(m => m.TurnosPageModule)
      },

      {
        path: 'asistencia',
        loadChildren: () =>
          import('../main/asistencia/asistencia.module')
          .then(m => m.AsistenciaPageModule)
      },

      {
        path: 'personal',
        loadChildren: () =>
          import('../main/personal/personal.module')
          .then(m => m.PersonalPageModule)
      },

      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }

    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}