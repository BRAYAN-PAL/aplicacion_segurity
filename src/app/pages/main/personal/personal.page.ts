import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Employee, RequestItem, WorkerDataService } from '../../../services/worker-data.service';

@Component({
  selector: 'app-personal',
  templateUrl: './personal.page.html',
  styleUrls: ['./personal.page.scss'],
  standalone: false,
})
export class PersonalPage implements OnInit {
  employees: Employee[] = [];
  search = '';
  selectedEmployee: Employee | null = null;
  employeeRequests: RequestItem[] = [];
  loadingEmployees = false;
  loadingRequests = false;
  updatingRequestId: string | null = null;

  constructor(private workerData: WorkerDataService, private router: Router) {}

  async ngOnInit() {
    await this.loadEmployees();
  }

  private async loadEmployees() {
    this.loadingEmployees = true;
    try {
      this.employees = await this.workerData.getEmployees(200);
    } catch (err) {
      console.error('Error cargando empleados', err);
      this.employees = [];
    } finally {
      this.loadingEmployees = false;
    }
  }

  async selectEmployee(employee: Employee) {
    this.selectedEmployee = employee;
    await this.loadEmployeeRequests(employee.id);
  }

  async approveRequest(request: RequestItem) {
    await this.updateRequestStatus(request.id, 'aprobada');
  }

  async rejectRequest(request: RequestItem) {
    await this.updateRequestStatus(request.id, 'rechazada');
  }

  async deleteRequest(request: RequestItem) {
    if (!window.confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) {
      return;
    }

    this.updatingRequestId = request.id;
    try {
      await this.workerData.deleteRequest(request.id);

      if (this.selectedEmployee) {
        await this.loadEmployeeRequests(this.selectedEmployee.id);
      }

      await this.loadEmployees();
    } catch (err) {
      console.error('Error eliminando solicitud', err);
    } finally {
      this.updatingRequestId = null;
    }
  }

  private async updateRequestStatus(requestId: string, estado: 'aprobada' | 'rechazada') {
    this.updatingRequestId = requestId;
    try {
      await this.workerData.updateRequestStatus(requestId, estado);

      if (this.selectedEmployee) {
        await this.loadEmployeeRequests(this.selectedEmployee.id);
      }

      await this.loadEmployees();
    } catch (err) {
      console.error('Error actualizando solicitud', err);
    } finally {
      this.updatingRequestId = null;
    }
  }

  private async loadEmployeeRequests(employeeId: string) {
    this.loadingRequests = true;
    try {
      this.employeeRequests = await this.workerData.getEmployeeRequests(employeeId);
    } catch (err) {
      console.error('Error cargando solicitudes del trabajador', err);
      this.employeeRequests = [];
    } finally {
      this.loadingRequests = false;
    }
  }

  initials(name?: string) {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  statusLabel(e: Employee) {
    if (e.activo === false) return 'Inactivo';
    return 'Activo';
  }

  statusClass(e: Employee) {
    if (e.activo === false) return 'falta';
    return 'active';
  }

  get filtered() {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.employees;
    return this.employees.filter((e) => (e.nombre || '').toLowerCase().includes(q));
  }

  requestStateLabel(request: RequestItem) {
    return request.estado || 'pendiente';
  }

  requestStateClass(request: RequestItem) {
    if (request.estado === 'aprobada') return 'approved';
    if (request.estado === 'rechazada') return 'rejected';
    return 'pending';
  }

  formatCreatedAt(createdAt?: string | null) {
    if (!createdAt) return '-';

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return createdAt;

    return new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  openNotifications() {
    this.router.navigate(['/notificaciones']);
  }
}
