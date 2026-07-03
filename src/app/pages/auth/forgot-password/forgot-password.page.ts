import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: false,
})
export class ForgotPasswordPage implements OnInit {
  isBusy: boolean = false;
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor(private supabase: SupabaseService) {}

  ngOnInit() {}

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.value.email || '';
    this.isBusy = true;
    const { error } = await this.supabase.resetPassword(email);
    this.isBusy = false;

    if (error) {
      alert(error.message);
      return;
    }

    alert('Correo de recuperacion enviado');
    this.form.reset();
  }

}
