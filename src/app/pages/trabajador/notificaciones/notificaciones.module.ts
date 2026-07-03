import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NotificacionesPage } from './notificaciones.page';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared-module';

const routes: Routes = [
  { path: '', component: NotificacionesPage }
];

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes), SharedModule],
  declarations: [NotificacionesPage]
})
export class NotificacionesPageModule {}
