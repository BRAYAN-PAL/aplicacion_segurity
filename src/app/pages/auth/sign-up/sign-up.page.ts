import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  standalone: false,
})
export class SignUpPage implements OnInit {

  correo: string = '';
  usuario: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(
    private router: Router,
    private supabase: SupabaseService
  ) {}

  ngOnInit() {}

  async registrar() {
    // VALIDAR CAMPOS
    if (
      !this.correo ||
      !this.usuario ||
      !this.password ||
      !this.confirmPassword
    ) {
      alert('Completa todos los campos');
      return;
    }

    // VALIDAR PASSWORD
    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    const usuarioLimpio = this.usuario.trim();
    const { error } = await this.supabase.signUp(
      this.correo,
      this.password,
      usuarioLimpio
    );

    if (error) {
      alert(error.message);
      return;
    }

    alert('Cuenta creada. Revisa tu correo si requiere confirmacion.');

    // LIMPIAR
    this.correo = '';
    this.usuario = '';
    this.password = '';
    this.confirmPassword = '';

    // REDIRECCIONAR
    this.router.navigate(['/auth']);
  }

}