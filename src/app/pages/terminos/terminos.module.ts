import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TerminosPageRoutingModule } from './terminos-routing.module';
import { TerminosPage } from './terminos.page';

@NgModule({
  imports: [CommonModule, IonicModule, TerminosPageRoutingModule],
  declarations: [TerminosPage],
})
export class TerminosPageModule {}