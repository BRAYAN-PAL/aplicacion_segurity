import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WorkerDataService, Employee, Shift } from '../../../services/worker-data.service';
@Component({
  selector: 'app-trabajador-horario',
  templateUrl: './horario.page.html',
  styleUrls: ['./horario.page.scss'],
  standalone: false,
})
export class HorarioPage implements OnInit {
  employee: Employee | null = null;
  shifts: Shift[] = [];
  weekLabel: string = '';

  constructor(private workerData: WorkerDataService, private router: Router) {}


  abrirNotificaciones() {
    this.router.navigate(['/notificaciones']);
  }
  
  async ngOnInit() {
    this.weekLabel = this.getWeekLabel();
    this.employee = await this.workerData.ensureEmployee();
    if (!this.employee) {
      return;
    }

    this.shifts = await this.workerData.getUpcomingShifts(this.employee.id, 6);
  }

  private getWeekLabel() {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const format = (date: Date) =>
      `${date.getDate()} ${date.toLocaleString('es-ES', { month: 'short' })}`;

    return `${format(start)} - ${format(end)}`;
  }
  
}
