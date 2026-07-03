import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AlertController, MenuController } from '@ionic/angular';
import { filter, Subscription } from 'rxjs';
import { SupabaseService } from './services/supabase.service';
import { WorkerDataService, Employee } from './services/worker-data.service';

type MenuEntry = {
  label: string;
  icon: string;
  route: string;
};

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentRole: 'admin' | 'trabajador' | null = null;
  employee: Employee | null = null;
  private authSubscription: { unsubscribe: () => void } | null = null;
  private routerSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private menuCtrl: MenuController,
    private supabase: SupabaseService,
    private workerData: WorkerDataService,
  ) {}

  async ngOnInit() {
    await this.syncUserContext();

    this.authSubscription = this.supabase
      .getClient()
      .auth.onAuthStateChange(async () => {
        await this.syncUserContext();
      }).data.subscription;
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  get roleMenuItems(): MenuEntry[] {
    return [
      {
        label: 'Inicio',
        icon: 'home-outline',
        route:
          this.currentRole === 'admin' ? '/tabs/home' : '/trabajador/inicio',
      },
      { label: 'Perfil', icon: 'person-outline', route: '/perfil' },
    ];
  }

  get displayName(): string {
    return this.employee?.nombre || 'Usuario';
  }

  get displayRole(): string {
    return this.currentRole === 'admin' ? 'Administrador' : 'Trabajador';
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

  async confirmLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Deseas cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Cerrar sesión', role: 'confirm' },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    if (result.role !== 'confirm') return;

    await this.supabase.signOut();
    await this.router.navigate(['/auth'], { replaceUrl: true });
  }

  private async syncUserContext() {
    const { data } = await this.supabase.getSession();
    const user = data.session?.user;

    this.isAuthenticated = !!user;

    if (!user) {
      this.currentRole = null;
      this.employee = null;
      return;
    }

    this.currentRole = (await this.supabase.getCurrentRole()) as
      | 'admin'
      | 'trabajador'
      | null;
    this.employee = await this.workerData.ensureEmployee();
  }
}
