import { Component, OnInit } from '@angular/core';
import { WorkerDataService, Employee, RequestItem } from '../../../services/worker-data.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-trabajador-solicitudes',
  templateUrl: './solicitudes.page.html',
  styleUrls: ['./solicitudes.page.scss'],
  standalone: false,
})
export class SolicitudesPage implements OnInit {
  employee: Employee | null = null;
  tipo: string = 'cambio_turno';
  fechaInicio: string = '';
  fechaFin: string = '';
  motivo: string = '';
  historial: RequestItem[] = [];
  isBusy: boolean = false;

  constructor(private workerData: WorkerDataService, private router: Router) {}

  abrirNotificaciones() {
    this.router.navigate(['/notificaciones']);
  }
  async ngOnInit() {
    this.employee = await this.workerData.ensureEmployee();
    if (!this.employee) {
      return;
    }

    await this.loadRequests();
  }

  async enviarSolicitud() {
    if (!this.employee || this.isBusy) {
      return;
    }

    this.isBusy = true;
    await this.workerData.createRequest(this.employee.id, {
      tipo: this.tipo,
      fecha_inicio: this.fechaInicio || null,
      fecha_fin: this.fechaFin || null,
      motivo: this.motivo || null,
      estado: 'pendiente',
    });
    this.isBusy = false;

    this.fechaInicio = '';
    this.fechaFin = '';
    this.motivo = '';

    await this.loadRequests();
  }

  async eliminarSolicitud(item: RequestItem) {
    if (!window.confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) {
      return;
    }

    this.isBusy = true;
    try {
      await this.workerData.deleteRequest(item.id);
      await this.loadRequests();
    } catch (err) {
      console.error('Error eliminando solicitud', err);
    } finally {
      this.isBusy = false;
    }
  }

  private async loadRequests() {
    if (!this.employee) {
      return;
    }
    this.historial = await this.workerData.getRequests(this.employee.id, 10);
  }
}
