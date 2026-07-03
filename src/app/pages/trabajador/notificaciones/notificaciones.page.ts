import { Component, OnInit } from '@angular/core';
import { WorkerDataService } from '../../../services/worker-data.service';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.page.html',
  styleUrls: ['./notificaciones.page.scss'],
  standalone: false,
})
export class NotificacionesPage implements OnInit {
  notifications: any[] = [];

  constructor(private workerData: WorkerDataService, private toastCtrl: ToastController, private router: Router) {}

  abrirNotificaciones() {
    this.router.navigate(['/notificaciones']);
  }
  async ngOnInit() {
    await this.load();
  }

  async load() {
    const emp = await this.workerData.ensureEmployee();
    if (!emp) return;
    this.notifications = await this.workerData.getNotificationsForEmployee(emp.id);
  }

  async markRead(n: any) {
    try {
      await this.workerData.markNotificationRead(n.id);
      const t = await this.toastCtrl.create({ message: 'Marcada como leída', duration: 1500 });
      await t.present();
      await this.load();
    } catch (e) {
      console.error(e);
    }
  }
}
