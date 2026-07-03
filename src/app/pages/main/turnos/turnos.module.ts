import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TurnosPageRoutingModule } from './turnos-routing.module';

import { TurnosPage } from './turnos.page';
import { SharedModule } from 'src/app/shared/shared-module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TurnosPageRoutingModule,
    SharedModule
  ],
  declarations: [TurnosPage]
})
export class TurnosPageModule {}
