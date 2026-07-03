import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { InicioPageRoutingModule } from './inicio-routing.module';
import { InicioPage } from './inicio.page';
import { SharedModule } from 'src/app/shared/shared-module';

@NgModule({
  imports: [CommonModule, IonicModule, InicioPageRoutingModule,SharedModule,SharedModule],
  declarations: [InicioPage],
})
export class InicioPageModule {}
