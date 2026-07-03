import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private router: Router,
  ) {}

    async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    // Si hay force_logout, limpiar y dejar pasar al login
    if (sessionStorage.getItem('force_logout') === '1') {
      sessionStorage.removeItem('force_logout');
      return true;
    }

    const { data } = await this.supabase.getSession();
    const user = data.session?.user;

    if (!user) return true;

    
    const { data: profile } = await this.supabase.getProfile(user.id);

    if (profile?.role?.trim() === 'admin')
      return this.router.createUrlTree(['/tabs/home']);

    return this.router.createUrlTree(['/trabajador']);
  }
}
