import { Component, OnInit } from '@angular/core';
import { WorkerDataService, Attendance, Employee } from '../../../services/worker-data.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
@Component({
  selector: 'app-trabajador-asistencia',
  templateUrl: './asistencia.page.html',
  styleUrls: ['./asistencia.page.scss'],
  standalone: false,
})
export class AsistenciaTrabajadorPage implements OnInit {
  employee: Employee | null = null;
  puntualidad: number = 0;
  horasMes: number = 0;
  tardanzas: number = 0;
  registros: Attendance[] = [];

  constructor(private workerData: WorkerDataService, private router: Router, private toastCtrl: ToastController) {}
abrirNotificaciones() {
    this.router.navigate(['/notificaciones']);
  }
  async ngOnInit() {
    this.employee = await this.workerData.ensureEmployee();
    if (!this.employee) {
      return;
    }

    const summary = await this.workerData.getAttendanceSummary(this.employee.id);
    this.puntualidad = summary.puntualidad;
    this.tardanzas = summary.tardanzas;
    this.horasMes = await this.workerData.getHoursThisMonth(this.employee.id);
    this.registros = await this.workerData.getRecentAttendance(this.employee.id);
  }

  async marcarEntrada() {
    if (!this.employee) {
      const t = await this.toastCtrl.create({ message: 'Empleado no encontrado', duration: 2000, color: 'danger' });
      await t.present();
      return;
    }

    try {
      const res: any = await this.workerData.markEntry(this.employee.id);

      if (res && (res.error || res.data === null)) {
        const msg = res.error?.message || (res.error && res.message) || 'Ya registró su entrada el día de hoy.';
        const t = await this.toastCtrl.create({ message: msg, duration: 2500, color: 'warning' });
        await t.present();
        return;
      }

      const t = await this.toastCtrl.create({ message: 'Entrada registrada', duration: 2000, color: 'success' });
      await t.present();

      // Refresh local data
      const summary = await this.workerData.getAttendanceSummary(this.employee.id);
      this.puntualidad = summary.puntualidad;
      this.tardanzas = summary.tardanzas;
      this.horasMes = await this.workerData.getHoursThisMonth(this.employee.id);
      this.registros = await this.workerData.getRecentAttendance(this.employee.id);
    } catch (e) {
      console.error('Error marcando entrada', e);
      const t = await this.toastCtrl.create({ message: 'Error registrando asistencia', duration: 2500, color: 'danger' });
      await t.present();
    }
  }
}
