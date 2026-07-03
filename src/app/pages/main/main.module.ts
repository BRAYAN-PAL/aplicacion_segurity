import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { MainPageRoutingModule } from './main-routing.module';
import { MainPage } from './main.page';

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule, MainPageRoutingModule],
  declarations: [MainPage],
})
export class MainPageModule {}
