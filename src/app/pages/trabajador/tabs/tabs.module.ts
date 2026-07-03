import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TrabajadorTabsRoutingModule } from './tabs-routing.module';
import { TrabajadorTabsPage } from './tabs.page';

@NgModule({
  imports: [CommonModule, IonicModule, TrabajadorTabsRoutingModule],
  declarations: [TrabajadorTabsPage],
})
export class TrabajadorTabsPageModule {}
