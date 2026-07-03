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
export class WorkerGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private router: Router,
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    const { data } = await this.supabase.getSession();
    const user = data.session?.user;

    if (!user) return this.router.createUrlTree(['/auth']);

    
    const { data: profile } = await this.supabase.getProfile(user.id);

    if (profile?.role?.trim() === 'admin')
      return this.router.createUrlTree(['/tabs']);

    return true;
  }
}
