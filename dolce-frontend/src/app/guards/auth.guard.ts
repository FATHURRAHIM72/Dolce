import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

/** Service that handles login checks and role extraction */
@Injectable({ providedIn: 'root' })
export class AuthGuardService {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const decoded: any = jwtDecode(token);
      const now = Date.now() / 1000;

      if (decoded.exp && decoded.exp < now) {
        this.router.navigate(['/login']);
        return false;
      }

      return true;
    } catch (err) {
      this.router.navigate(['/login']);
      return false;
    }
  }

  getUserRole(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      return decoded.role || null;
    } catch {
      return null;
    }
  }
}

/** Angular route guard using the AuthGuardService */
export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthGuardService);
  const router = inject(Router);

  if (!authService.canActivate()) {
    return false;
  }

  const expectedRoles = route.data?.['roles'];
  const userRole = authService.getUserRole();

  if (expectedRoles && !expectedRoles.includes(userRole)) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
