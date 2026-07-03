import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Employee, WorkerDataService } from '../../services/worker-data.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false,
})
export class PerfilPage implements OnInit {
  employee: Employee | null = null;
  email = 'Sin correo';
  roleLabel = 'Usuario';
  loading = true;

  constructor(
    private router: Router,
    private supabase: SupabaseService,
    private workerData: WorkerDataService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {}

  async ngOnInit() {
    const { data } = await this.supabase.getSession();
    const user = data.session?.user;

    if (!user) {
      await this.router.navigate(['/auth']);
      return;
    }

    this.email = user.email || 'Sin correo';
    this.roleLabel = (await this.supabase.getCurrentRole()) === 'admin' ? 'Administrador' : 'Trabajador';
    this.employee = await this.workerData.ensureEmployee();
    this.loading = false;
  }

  get displayName(): string {
    return this.employee?.nombre || 'Usuario';
  }

  get displayPosition(): string {
    return this.employee?.puesto || 'Sin puesto';
  }

  get displayLocation(): string {
    return this.employee?.sede || 'Sin sede';
  }

  get profilePhoto(): string | null {
    const photo = this.employee?.foto_perfil;
    return photo && photo.trim().length ? photo : null;
  }

  async openEditProfile() {
    const alert = await this.alertCtrl.create({
      header: 'Editar perfil',
      message: 'Por ahora se muestra la información disponible de tu cuenta. Si quieres, después conectamos esta acción a edición real.',
      buttons: ['OK'],
    });

    await alert.present();
  }

  async openTerms() {
    await this.router.navigate(['/terminos']);
  }

      async logout() {
    try {
      await this.supabase.signOut();
      // force_logout ya se setea dentro de signOut()
    } catch (e) {
      console.error('Error en logout:', e);
      // Asegurar flag aunque falle
      sessionStorage.setItem('force_logout', '1');
    }
    await this.router.navigate(['/auth'], { replaceUrl: true });
  }

  async showPhotoTip() {
    const toast = await this.toastCtrl.create({
      message: 'La foto de perfil se toma de los datos actuales.',
      duration: 1800,
      position: 'bottom',
    });

    await toast.present();
  }
}