import { Injectable } from '@angular/core';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export type Employee = {
  id: string;
  user_id: string;
  nombre: string;
  puesto?: string | null;
  sede?: string | null;
  foto_perfil?: string | null;
  activo?: boolean | null;
};

export type Shift = {
  id: string;
  employee_id: string;
  fecha: string;
  inicio: string;
  fin: string;
  sede?: string | null;
  estado?: string | null;
};

export type ShiftAssignmentInput = {
  employeeId: string;
  fecha: string;
  inicio: string;
  fin: string;
  sede?: string | null;
  estado?: string | null;
};

export type Attendance = {
  id: string;
  employee_id: string;
  fecha: string;
  hora: string;
  tipo: string;
  metodo?: string | null;
  estado?: string | null;
};

export type RequestItem = {
  id: string;
  employee_id: string;
  tipo: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  motivo?: string | null;
  estado?: string | null;
  created_at?: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class WorkerDataService {
  private client: SupabaseClient;

  constructor(private supabase: SupabaseService) {
    this.client = supabase.getClient();
  }

  async getUser(): Promise<User | null> {
    const { data } = await this.supabase.getSession();
    return data.session?.user || null;
  }

  async ensureEmployee(): Promise<Employee | null> {
    const user = await this.getUser();
    if (!user) {
      return null;
    }

    const { data: existing } = await this.client
      .from('employees')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return existing as Employee;
    }

    const metadata = user.user_metadata || {};
    const email = user.email || '';
    const emailAlias = email.includes('@') ? email.split('@')[0] : '';
    const nombre = metadata['name'] || metadata['username'] || emailAlias || 'Trabajador';

    const { data: created } = await this.client
      .from('employees')
      .insert({ user_id: user.id, nombre })
      .select('*')
      .single();

    return (created as Employee) || null;
  }

  async getCurrentShift(employeeId: string): Promise<Shift | null> {
    const today = this.toDateString(new Date());
    const { data } = await this.client
      .from('shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('fecha', today)
      .order('inicio', { ascending: true })
      .limit(1);

    return data && data.length ? (data[0] as Shift) : null;
  }

  async getShiftsByDate(fecha: string): Promise<Shift[]> {
    const { data } = await this.client
      .from('shifts')
      .select('*')
      .eq('fecha', fecha)
      .order('inicio', { ascending: true });

    return (data as Shift[]) || [];
  }

  async saveShiftAssignment(input: ShiftAssignmentInput): Promise<Shift | null> {
    const basePayload = {
      employee_id: input.employeeId,
      fecha: input.fecha,
      inicio: input.inicio,
      fin: input.fin,
      sede: input.sede || null,
      estado: input.estado || 'programado',
    };

    // Ensure only one shift per employee per date: check existing
    const { data: existing } = await this.client
      .from('shifts')
      .select('*')
      .eq('employee_id', input.employeeId)
      .eq('fecha', input.fecha)
      .limit(1)
      .maybeSingle();

    if (existing && existing.id) {
      const { data: updated } = await this.client
        .from('shifts')
        .update(basePayload)
        .eq('id', existing.id)
        .select('*')
        .single();
      return (updated as Shift) || null;
    }

    const { data: created } = await this.client
      .from('shifts')
      .insert(basePayload)
      .select('*')
      .single();

    return (created as Shift) || null;
  }

  async deleteShift(shiftId: string) {
    return this.client.from('shifts').delete().eq('id', shiftId);
  }

  async getUpcomingShifts(employeeId: string, limit = 6): Promise<Shift[]> {
    const today = this.toDateString(new Date());
    const { data } = await this.client
      .from('shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('fecha', today)
      .order('fecha', { ascending: true })
      .order('inicio', { ascending: true })
      .limit(limit);

    return (data as Shift[]) || [];
  }

  async getAttendanceSummary(employeeId: string) {
    const today = new Date();
    const last30 = new Date();
    last30.setDate(today.getDate() - 30);

    const { data } = await this.client
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('fecha', this.toDateString(last30))
      .order('fecha', { ascending: false });

    const items = (data as Attendance[]) || [];
    const total = items.length;
    const tardanzas = items.filter((a) => a.estado === 'tarde').length;
    const puntualidad = total ? Math.round(((total - tardanzas) / total) * 100) : 0;

    return {
      puntualidad,
      tardanzas,
      total,
    };
  }

  async getHoursThisMonth(employeeId: string) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data } = await this.client
      .from('shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('fecha', this.toDateString(firstDay))
      .lte('fecha', this.toDateString(lastDay));

    const shifts = (data as Shift[]) || [];
    const totalMinutes = shifts.reduce((acc, shift) => {
      const minutes = this.diffMinutes(shift.inicio, shift.fin);
      return acc + (minutes > 0 ? minutes : 0);
    }, 0);

    return Math.round(totalMinutes / 60);
  }

  async getRecentAttendance(employeeId: string, limit = 6): Promise<Attendance[]> {
    const { data } = await this.client
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .limit(limit);

    return (data as Attendance[]) || [];
  }

  async getAttendanceByEmployee(employeeId: string): Promise<Attendance[]> {
    const { data } = await this.client
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });

    return (data as Attendance[]) || [];
  }

  async getShiftsByEmployee(employeeId: string): Promise<Shift[]> {
    const { data } = await this.client
      .from('shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .order('fecha', { ascending: false })
      .order('inicio', { ascending: false });

    return (data as Shift[]) || [];
  }

  async createAttendance(employeeId: string, tipo: string, latitud?: number | null, longitud?: number | null) {
    const now = new Date();
    const payload: any = {
      employee_id: employeeId,
      fecha: this.toDateString(now),
      hora: this.toTimeString(now),
      tipo,
      metodo: 'manual',
      estado: 'a_tiempo',
    };

    if (typeof latitud === 'number') payload.latitud = latitud;
    if (typeof longitud === 'number') payload.longitud = longitud;

    return this.client.from('attendance').insert(payload);
  }

  async getAttendanceByDate(fecha: string) {
    const { data } = await this.client
      .from('attendance')
      .select('*')
      .eq('fecha', fecha)
      .order('hora', { ascending: true });

    return (data as Attendance[]) || [];
  }

  async deleteAttendance(attendanceId: string) {
    return this.client.from('attendance').delete().eq('id', attendanceId);
  }
  async markEntry(employeeId: string, latitud?: number | null, longitud?: number | null) {
    const today = this.toDateString(new Date());

    // Check if an 'entrada' already exists for this employee today
    const { data: existing } = await this.client
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('fecha', today)
      .eq('tipo', 'entrada')
      .limit(1)
      .maybeSingle();

    if (existing && existing.id) {
      return { error: 'exists', message: 'Ya registró su entrada el día de hoy.' };
    }

    return this.createAttendance(employeeId, 'entrada', latitud, longitud);
  }

  async markExit(employeeId: string, latitud?: number | null, longitud?: number | null) {
    const today = this.toDateString(new Date());

    // Verify that an 'entrada' exists for today
    const { data: lastEntry } = await this.client
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('fecha', today)
      .eq('tipo', 'entrada')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastEntry) {
      return { error: 'no_entry', message: 'Primero debe registrar una entrada.' };
    }

    // Update the last entry estado -> 'completado'
    if (lastEntry && lastEntry.id) {
      await this.client
        .from('attendance')
        .update({ estado: 'completado' })
        .eq('id', lastEntry.id);
    }

    // Insert a 'salida' record as well
    return this.createAttendance(employeeId, 'salida', latitud, longitud);
  }

  // Notifications
  async createNotification(employeeId: string, titulo: string, mensaje: string) {
    const payload = {
      employee_id: employeeId,
      titulo,
      mensaje,
      leida: false,
    };
    return this.client.from('notifications').insert(payload);
  }

  async getNotificationsForEmployee(employeeId: string): Promise<any[]> {
    const { data } = await this.client
      .from('notifications')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
    return data || [];
  }

  async markNotificationRead(notificationId: string) {
    return this.client.from('notifications').update({ leida: true }).eq('id', notificationId);
  }

  async getUnreadNotificationsCount(employeeId: string): Promise<number> {
    const { count } = await this.client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId)
      .eq('leida', false);

    return count || 0;
  }

  subscribeToTable(tableName: string, callback: (payload?: any) => void) {
    try {
      const channel = this.client
        .channel(`table_changes_${tableName}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          (payload) => {
            try {
              callback(payload);
            } catch (e) {
              console.error('Callback error for realtime payload', e);
            }
          }
        )
        .subscribe();

      return channel;
    } catch (error) {
      console.warn('Realtime not available or subscribe failed', error);
      return null;
    }
  }

  unsubscribeChannel(channel: any) {
    try {
      if (!channel) return;
      this.client.removeChannel(channel);
    } catch (e) {
      console.warn('Failed to remove realtime channel', e);
    }
  }

  async createRequest(employeeId: string, request: Partial<RequestItem>) {
    return this.client
      .from('requests')
      .insert({
        employee_id: employeeId,
        tipo: request.tipo,
        fecha_inicio: request.fecha_inicio || null,
        fecha_fin: request.fecha_fin || null,
        motivo: request.motivo || null,
        estado: request.estado || 'pendiente',
      });
  }

  async getRequests(employeeId: string, limit = 10): Promise<RequestItem[]> {
    const { data } = await this.client
      .from('requests')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data as RequestItem[]) || [];
  }

  async getEmployeeRequests(employeeId: string): Promise<RequestItem[]> {
    const { data } = await this.client
      .from('requests')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    return (data as RequestItem[]) || [];
  }

  async updateRequestStatus(requestId: string, estado: 'pendiente' | 'aprobada' | 'rechazada') {
    const { data: updated } = await this.client
      .from('requests')
      .update({ estado })
      .eq('id', requestId)
      .select('*')
      .single();

    try {
      const req = updated as RequestItem | null;
      if (req && req.employee_id) {
        const titulo = `Solicitud ${estado}`;
        const fecha = new Date().toLocaleString();
        const mensaje = `Solicitud (${req.tipo}) -> ${estado}. Actualizado: ${fecha}`;
        await this.createNotification(req.employee_id, titulo, mensaje);
      }
    } catch (e) {
      console.warn('Failed to create notification for request status change', e);
    }

    return updated;
  }

  // Admin helpers
  async getAllRequests(limit = 1000): Promise<RequestItem[]> {
    const { data } = await this.client
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data as RequestItem[]) || [];
  }

  async getPendingRequests(): Promise<RequestItem[]> {
    const { data } = await this.client
      .from('requests')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false });

    return (data as RequestItem[]) || [];
  }

  async deleteRequest(requestId: string) {
    return this.client
      .from('requests')
      .delete()
      .eq('id', requestId);
  }

  // Fetch list of employees. Optional limit and onlyActive flag.
  async getEmployees(limit = 100, onlyActive = false): Promise<Employee[]> {
    let query = this.client.from('employees').select('*').order('nombre', { ascending: true }).limit(limit);

    if (onlyActive) {
      // note: Supabase client returns a typed builder; chaining eq is fine
      query = query.eq('activo', true);
    }

    const { data } = await query;
    return (data as Employee[]) || [];
  }

  private toDateString(date: Date) {
    return date.toISOString().split('T')[0];
  }

  private toTimeString(date: Date) {
    return date.toTimeString().slice(0, 5);
  }

  private diffMinutes(start: string, end: string) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if (Number.isNaN(sh) || Number.isNaN(sm) || Number.isNaN(eh) || Number.isNaN(em)) {
      return 0;
    }
    return (eh * 60 + em) - (sh * 60 + sm);
  }
}
