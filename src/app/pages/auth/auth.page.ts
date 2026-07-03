import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: false,
})
export class AuthPage implements OnInit {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  isBusy: boolean = false;

  constructor(
    private router: Router,
    private supabase: SupabaseService,
  ) {}

      async ngOnInit() {
    // Si hay force_logout, no restaurar sesión aunque localStorage tenga datos
    if (sessionStorage.getItem('force_logout') === '1') {
      sessionStorage.removeItem('force_logout');
      return;
    }

    const { data } = await this.supabase.getSession();
    const user = data.session?.user;

    if (!user) return;

    await this.navigateByRole(user.id);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.value.email!;
    const password = this.form.value.password!;

    this.isBusy = true;

  
    const { data, error } = await this.supabase.signInWithPassword(
      email,
      password,
    );

    this.isBusy = false;

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;

    if (!user) {
      alert('No se pudo obtener la sesión');
      return;
    }

    await this.navigateByRole(user.id);
  }

  
  private async navigateByRole(userId: string): Promise<void> {
    const { data: profile, error } = await this.supabase.getProfile(userId);

    if (error) {
      console.error('Error al obtener perfil:', error);
      alert('Error al obtener perfil');
      return;
    }

    
    if (profile?.role?.trim() === 'admin') {
      this.router.navigate(['/tabs/home']);
    } else {
      this.router.navigate(['/trabajador']);
    }
  }
}
