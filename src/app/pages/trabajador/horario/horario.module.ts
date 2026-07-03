import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HorarioPageRoutingModule } from './horario-routing.module';
import { HorarioPage } from './horario.page';
import { SharedModule } from 'src/app/shared/shared-module';

@NgModule({
  imports: [CommonModule, IonicModule, HorarioPageRoutingModule, SharedModule],
  declarations: [HorarioPage],
})
export class HorarioPageModule {}
