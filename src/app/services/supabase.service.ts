import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: true,
          storage: localStorage, // importante para Ionic
        },
      },
    );
  }

  getClient() {
    return this.client;
  }

  getSession() {
    return this.client.auth.getSession();
  }

  signInWithPassword(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  signInWithMagicLink(email: string) {
    return this.client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });
  }

  async signUp(email: string, password: string, username?: string) {
    const result = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: username ? { username } : undefined,
      },
    });

    console.log('SIGNUP:', result);

    if (result.error) return result;

    const user = result.data.user;

    if (user) {
      const profileResult = await this.client.from('profiles').insert({
        id: user.id,
        email: user.email,
        username: username || '',
        role: 'trabajador',
      });
      console.log('PROFILE INSERT:', profileResult);
    }

    return result;
  }

  getProfile(userId: string) {
    return this.client.from('profiles').select('*').eq('id', userId).single();
  }

  async getCurrentRole(): Promise<string | null> {
    try {
      const { data } = await this.getSession();
      const user = data.session?.user;
      if (!user) return null;
      const { data: profile } = await this.getProfile(user.id);
      return profile?.role || null;
    } catch (e) {
      console.warn('getCurrentRole error', e);
      return null;
    }
  }

  resetPassword(email: string) {
    return this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/forgot-password`,
    });
  }

  updatePassword(newPassword: string) {
    return this.client.auth.updateUser({ password: newPassword });
  }

            async signOut() {
    // Marcar logout forzado en sessionStorage
    sessionStorage.setItem('force_logout', '1');

    // Limpiar localStorage de claves de sesión
    this.clearLocalSession();

    // Recrear el cliente para que no tenga nada en memoria
    this.client = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: true,
          storage: localStorage,
        },
      },
    );

    return { error: null };
  }

  private clearLocalSession() {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith('sb-') ||
        key.toLowerCase().includes('supabase') ||
        key.toLowerCase().includes('auth')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }
}
