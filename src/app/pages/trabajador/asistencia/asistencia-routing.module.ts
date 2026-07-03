import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AsistenciaTrabajadorPage } from './asistencia.page';

const routes: Routes = [
  {
    path: '',
    component: AsistenciaTrabajadorPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AsistenciaTrabajadorPageRoutingModule {}
