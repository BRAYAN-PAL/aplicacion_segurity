import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AsistenciaTrabajadorPageRoutingModule } from './asistencia-routing.module';
import { AsistenciaTrabajadorPage } from './asistencia.page';
import { SharedModule } from 'src/app/shared/shared-module';

@NgModule({
  imports: [CommonModule, IonicModule, AsistenciaTrabajadorPageRoutingModule, SharedModule],
  declarations: [AsistenciaTrabajadorPage],
})
export class AsistenciaTrabajadorPageModule {}
