import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { WorkerDataService, Employee, Attendance } from '../../../services/worker-data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  nombreUsuario: string = '';
  totalEmployees = 0;
  activeToday = 0;
  attendancePercent = 0;
  puestosCubiertos = 0;
  incidencias = 0;
  faltas = 0;
  agents: Array<{ name: string; role: string; sede: string; status: string }> = [];
  private attendanceChannel: any = null;
  private shiftsChannel: any = null;
  employees: Employee[] = [];
  attendanceRecords: Attendance[] = [];

  constructor(
    private router: Router,
    private supabase: SupabaseService,
    private workerData: WorkerDataService,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    const { data } = await this.supabase.getSession();
    const user = data.session?.user;

    if (!user) {
      this.router.navigate(['/auth']);
      return;
    }

    const metadata = user.user_metadata || {};
    const email = user.email || '';
    const emailAlias = email.includes('@') ? email.split('@')[0] : '';

    this.nombreUsuario =
      metadata['name'] ||
      metadata['username'] ||
      emailAlias ||
      'Usuario';

    await this.loadDashboard();

    // Subscribe to realtime changes for attendance and shifts to refresh dashboard
    try {
      this.attendanceChannel = this.workerData.subscribeToTable('attendance', (payload: any) => {
        this.loadDashboard();
        const action = payload?.eventType || payload?.type || payload?.event || 'cambio';
        this.showRealtimeToast('Asistencia actualizada (' + action + ')');
      });

      this.shiftsChannel = this.workerData.subscribeToTable('shifts', (payload: any) => {
        this.loadDashboard();
        const action = payload?.eventType || payload?.type || payload?.event || 'cambio';
        this.showRealtimeToast('Turnos actualizados (' + action + ')');
      });
    } catch (e) {
      console.warn('Realtime subscription failed', e);
    }
  }

  ngOnDestroy(): void {
    try {
      this.workerData.unsubscribeChannel(this.attendanceChannel);
      this.workerData.unsubscribeChannel(this.shiftsChannel);
    } catch (e) {
      // ignore
    }
  }

  private async showRealtimeToast(message: string) {
    try {
      const t = await this.toastCtrl.create({
        message,
        duration: 2500,
        position: 'top',
        color: 'tertiary'
      });
      await t.present();
    } catch (e) {
      console.warn('Could not show toast', e);
    }
  }

  async loadDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const employees = await this.workerData.getEmployees(1000);
    this.employees = employees;
    this.totalEmployees = employees.length;

    const shifts = await this.workerData.getShiftsByDate(today);
    this.puestosCubiertos = shifts.length;

    const attendance = await this.workerData.getAttendanceByDate(today);
    this.attendanceRecords = attendance;
    const entries = attendance.filter((a) => a.tipo === 'entrada');
    const presenteIds = new Set(entries.map((e) => e.employee_id));
    this.activeToday = presenteIds.size;
    this.attendancePercent = this.totalEmployees ? Math.round((this.activeToday / this.totalEmployees) * 100) : 0;

    // Incidencias: registros con estado distinto de 'a_tiempo'
    this.incidencias = attendance.filter((a) => a.estado && a.estado !== 'a_tiempo').length;

    // Faltas: empleados without entrada
    this.faltas = Math.max(0, this.totalEmployees - this.activeToday);

    // Build small agent list: include scheduled shifts plus any employees who marked entrada
    const empMap = new Map(employees.map((e: Employee) => [e.id, e]));

    const agents: Array<{ name: string; role: string; sede: string; status: string }> = [];

    // First, include up to 6 scheduled shifts
    const seen = new Set<string>();
    for (const s of shifts) {
      if (agents.length >= 6) break;
      const emp = empMap.get(s.employee_id as string);
      const status = presenteIds.has(s.employee_id) ? 'Activo' : 'Falta';
      agents.push({ name: emp?.nombre || 'Trabajador', role: emp?.puesto || 'Agente', sede: s.sede || emp?.sede || '', status });
      seen.add(s.employee_id);
    }

    // If we still have space, add employees who have an 'entrada' today but no scheduled shift
    if (agents.length < 6) {
      for (const id of Array.from(presenteIds)) {
        if (agents.length >= 6) break;
        if (seen.has(id)) continue;
        const emp = empMap.get(id as string);
        if (!emp) continue;
        agents.push({ name: emp.nombre || 'Trabajador', role: emp.puesto || 'Agente', sede: emp.sede || '', status: 'Activo' });
        seen.add(id);
      }
    }

    this.agents = agents;
  }

  openNotifications() {
    this.router.navigate(['/notificaciones']);
  }

  getEmployeeName(employeeId?: string) {
    if (!employeeId) return 'Trabajador';
    const e = this.employees.find((x) => x.id === employeeId);
    return e?.nombre || 'Trabajador';
  }

  async deleteAttendance(record: Attendance) {
    if (!record || !record.id) return;
    const confirmed = window.confirm(`Eliminar registro de ${this.getEmployeeName(record.employee_id)} a las ${record.hora}?`);
    if (!confirmed) return;

    try {
      await this.workerData.deleteAttendance(record.id);
      this.showRealtimeToast('Registro de asistencia eliminado');
      await this.loadDashboard();
    } catch (e) {
      console.error('Error borrando registro', e);
      this.showRealtimeToast('No se pudo eliminar registro');
    }
  }

  agentInitials(name?: string) {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => (n && n.length ? n[0] : ''))
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  async cerrarSesion() {
    await this.supabase.signOut();
    this.router.navigate(['/auth']);
  }
}