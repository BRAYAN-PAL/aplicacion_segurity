import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WorkerDataService, Employee, Shift } from '../../../services/worker-data.service';
import { SupabaseService } from '../../../services/supabase.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-trabajador-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: false,
})
export class InicioPage implements OnInit {
  employee: Employee | null = null;
  nombreUsuario: string = 'Trabajador';
  currentShift: Shift | null = null;
  shiftLabel: string = 'Sin turno asignado';
  shiftStatus: string = '';
  isBusy: boolean = false;

  constructor(
    private workerData: WorkerDataService,
    private supabase: SupabaseService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  private async getCurrentPosition(): Promise<{ lat?: number; lng?: number } | null> {
    if (!('geolocation' in navigator)) return null;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.employee = await this.workerData.ensureEmployee();
    if (!this.employee) {
      return;
    }

    this.nombreUsuario = this.employee.nombre || 'Trabajador';

    this.currentShift = await this.workerData.getCurrentShift(this.employee.id);
    if (this.currentShift) {
      this.shiftLabel = `En curso: ${this.currentShift.inicio} - ${this.currentShift.fin}`;
      this.shiftStatus = this.getShiftStatus(this.currentShift);
    } else {
      this.shiftLabel = 'Sin turno asignado hoy';
      this.shiftStatus = '';
    }
  }

  async marcarSalida() {
    if (!this.employee || this.isBusy) {
      return;
    }

    this.isBusy = true;
    try {
      const pos = await this.getCurrentPosition();
      const res: any = await this.workerData.markExit(this.employee.id, pos?.lat ?? null, pos?.lng ?? null);
      if (res && res.error === 'no_entry') {
        const t = await this.toastCtrl.create({ message: res.message || 'Primero debe registrar una entrada.', duration: 3000, color: 'warning' });
        await t.present();
      } else {
        const t = await this.toastCtrl.create({ message: 'Salida registrada', duration: 2000, color: 'success' });
        await t.present();
        await this.loadData();
      }
    } catch (e) {
      console.error(e);
      const t = await this.toastCtrl.create({ message: 'Error registrando salida', duration: 2500, color: 'danger' });
      await t.present();
    } finally {
      this.isBusy = false;
    }
  }
  openNotifications() {
    this.router.navigate(['/notificaciones']);
  }

  async marcarEntrada() {
    if (!this.employee || this.isBusy) {
      return;
    }

    this.isBusy = true;
    try {
      const pos = await this.getCurrentPosition();
      const res: any = await this.workerData.markEntry(this.employee.id, pos?.lat ?? null, pos?.lng ?? null);
      if (res && res.error === 'exists') {
        const t = await this.toastCtrl.create({ message: res.message || 'Ya registró su entrada.', duration: 3000, color: 'warning' });
        await t.present();
      } else {
        const t = await this.toastCtrl.create({ message: 'Entrada registrada', duration: 2000, color: 'success' });
        await t.present();
        await this.loadData();
      }
    } catch (e) {
      console.error(e);
      const t = await this.toastCtrl.create({ message: 'Error registrando entrada', duration: 2500, color: 'danger' });
      await t.present();
    } finally {
      this.isBusy = false;
    }
  }

      async cerrarSesion() {
    try {
      await this.supabase.signOut();
    } catch (e) {
      console.error('Error en cerrarSesion:', e);
      sessionStorage.setItem('force_logout', '1');
    }
    this.router.navigate(['/auth'], { replaceUrl: true });
  }

  abrirNotificaciones() {
    this.router.navigate(['/notificaciones']);
  }

  private getShiftStatus(shift: Shift) {
    const now = new Date();
    const start = this.parseTime(shift.inicio, now);
    const end = this.parseTime(shift.fin, now);
    if (!start || !end) {
      return '';
    }

    const diff = now.getTime() - start.getTime();
    const minutes = Math.max(0, Math.floor(diff / 60000));
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `Activo por ${hours}h ${rest}m`;
  }

  private parseTime(value: string, base: Date) {
    const parts = value.split(':').map(Number);
    if (parts.length < 2) {
      return null;
    }
    const date = new Date(base);
    date.setHours(parts[0], parts[1], 0, 0);
    return date;
  }
}
