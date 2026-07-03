import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Employee, Shift, WorkerDataService } from '../../../services/worker-data.service';

type CalendarDay = {
  date: string;
  label: string;
  dayNumber: string;
};

type ShiftRow = Shift & {
  employeeName: string;
  employeeRole: string;
  employeeSede: string;
};

@Component({
  selector: 'app-turnos',
  templateUrl: './turnos.page.html',
  styleUrls: ['./turnos.page.scss'],
  standalone: false,
})
export class TurnosPage implements OnInit {
  employees: Employee[] = [];
  selectedEmployeeId = '';
  selectedDate = this.toDateString(new Date());
  selectedStart = '06:00';
  selectedEnd = '14:00';
  selectedSede = '';
  selectedStatus = 'programado';
  selectedShiftId: string | null = null;
  calendarDays: CalendarDay[] = [];
  shiftRows: ShiftRow[] = [];
  isSaving = false;
  message = '';

  constructor(private workerData: WorkerDataService, private router: Router) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.employees = await this.workerData.getEmployees(200);

    if (!this.selectedEmployeeId && this.employees.length > 0) {
      this.selectedEmployeeId = this.employees[0].id;
      this.selectedSede = this.employees[0].sede || '';
    }

    this.calendarDays = this.buildCalendarDays(this.selectedDate);
    await this.loadShifts();
  }

  async onDateSelected(date: string) {
    this.selectedDate = date;
    this.calendarDays = this.buildCalendarDays(date);
    await this.loadShifts();
  }

  selectEmployee(employeeId: string) {
    this.selectedEmployeeId = employeeId;
    const employee = this.employees.find((item) => item.id === employeeId);
    this.selectedSede = employee?.sede || this.selectedSede;
  }

  selectShift(shift: ShiftRow) {
    this.selectedShiftId = shift.id;
    this.selectedEmployeeId = shift.employee_id;
    this.selectedStart = shift.inicio;
    this.selectedEnd = shift.fin;
    this.selectedSede = shift.sede || shift.employeeSede || '';
    this.selectedStatus = (shift.estado || 'programado') as 'programado' | 'activo' | 'tardanza' | 'descanso';
  }

  clearSelectedShift() {
    this.selectedShiftId = null;
  }

  async saveAssignment() {
    if (!this.selectedEmployeeId || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.message = '';

    try {
      await this.workerData.saveShiftAssignment({
        employeeId: this.selectedEmployeeId,
        fecha: this.selectedDate,
        inicio: this.selectedStart,
        fin: this.selectedEnd,
        sede: this.selectedSede || null,
        estado: this.selectedStatus as 'programado' | 'activo' | 'tardanza' | 'descanso',
      });

      this.message = this.selectedShiftId ? 'Turno modificado correctamente' : 'Turno asignado correctamente';
      this.selectedShiftId = null;
      await this.loadShifts();
    } catch (error) {
      console.error('Error guardando el turno', error);
      this.message = 'No se pudo guardar el turno';
    } finally {
      this.isSaving = false;
    }
  }

  async deleteShift(shift: ShiftRow) {
    const confirmed = window.confirm(`¿Eliminar el turno de ${shift.employeeName} del ${this.selectedDateLabel}?`);
    if (!confirmed) {
      return;
    }

    try {
      await this.workerData.deleteShift(shift.id);
      if (this.selectedShiftId === shift.id) {
        this.selectedShiftId = null;
      }
      this.message = 'Turno eliminado correctamente';
      await this.loadShifts();
    } catch (error) {
      console.error('Error eliminando el turno', error);
      this.message = 'No se pudo eliminar el turno';
    }
  }

  get selectedDateLabel() {
    return this.formatLongDate(this.selectedDate);
  }

  get selectedMonthLabel() {
    const date = this.fromDateString(this.selectedDate);
    return `${this.monthLabels[date.getMonth()]} ${date.getFullYear()}`;
  }

  get selectedDayCount() {
    return this.shiftRows.length;
  }

  private async loadShifts() {
    const shifts = await this.workerData.getShiftsByDate(this.selectedDate);
    const employeeMap = new Map(this.employees.map((employee) => [employee.id, employee]));

    this.shiftRows = shifts.map((shift) => {
      const employee = employeeMap.get(shift.employee_id);

      return {
        ...shift,
        employeeName: employee?.nombre || 'Trabajador',
        employeeRole: employee?.puesto || 'Agente',
        employeeSede: shift.sede || employee?.sede || 'Sin sede',
      };
    });

    if (this.selectedShiftId && !this.shiftRows.some((shift) => shift.id === this.selectedShiftId)) {
      this.selectedShiftId = null;
    }
  }

  initials(name?: string) {
    if (!name) return '';
    return name
      .split(' ')
      .map((item) => item[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  statusClass(status?: string | null) {
    if (status === 'activo') return 'active';
    if (status === 'tardanza') return 'tardanza';
    if (status === 'descanso') return 'programado';
    return 'programado';
  }

  statusLabel(status?: string | null) {
    if (!status) return 'Programado';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  private buildCalendarDays(anchorDateString: string): CalendarDay[] {
    const anchor = this.fromDateString(anchorDateString);
    const days: CalendarDay[] = [];

    for (let offset = -2; offset <= 2; offset += 1) {
      const date = new Date(anchor);
      date.setDate(anchor.getDate() + offset);
      const dateString = this.toDateString(date);

      days.push({
        date: dateString,
        label: this.weekdayLabels[date.getDay()],
        dayNumber: String(date.getDate()).padStart(2, '0'),
      });
    }

    return days;
  }

  private formatLongDate(dateString: string) {
    const date = this.fromDateString(dateString);
    return `${date.getDate()} ${this.monthLabels[date.getMonth()]} ${date.getFullYear()}`;
  }

  private fromDateString(dateString: string) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toDateString(date: Date) {
    return date.toISOString().split('T')[0];
  }

  private readonly weekdayLabels = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  private readonly monthLabels = [
    'ENERO',
    'FEBRERO',
    'MARZO',
    'ABRIL',
    'MAYO',
    'JUNIO',
    'JULIO',
    'AGOSTO',
    'SEPTIEMBRE',
    'OCTUBRE',
    'NOVIEMBRE',
    'DICIEMBRE',
  ];

  openNotifications() {
    this.router.navigate(['/notificaciones']);
  }

}
