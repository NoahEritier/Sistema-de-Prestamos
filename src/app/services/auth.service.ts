import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { ApiService } from './api.service';

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  expiresAt?: string;
  error?: string;
  lockedUntil?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private readonly SESSION_KEY = 'auth_token';

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    this.loadStoredUser();
  }

  /**
   * Intento de login
   */
  login(username: string, password: string): Observable<{ success: boolean; message?: string; lockedUntil?: number }> {
    return new Observable(observer => {
      this.apiService.post<LoginResponse>('/auth/login', { username, password }).subscribe({
        next: (response) => {
          if (response.success && response.token && response.user) {
            // Guardar token
            localStorage.setItem(this.SESSION_KEY, response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
            // Actualizar usuario actual
            this.currentUserSubject.next(response.user);
            
            observer.next({ success: true });
            observer.complete();
          } else {
            const message = response.error || 'Error al iniciar sesión';
            observer.next({ 
              success: false, 
              message,
              lockedUntil: response.lockedUntil
            });
            observer.complete();
          }
        },
        error: (error) => {
          let message = 'Error al conectar con el servidor';
          let lockedUntil: number | undefined;
          
          if (error.status === 401) {
            message = error.error?.error || 'Usuario o contraseña incorrectos';
          } else if (error.status === 423) {
            message = error.error?.error || 'Cuenta bloqueada';
            lockedUntil = error.error?.lockedUntil;
          } else if (error.error?.error) {
            message = error.error.error;
          }
          
          observer.next({ success: false, message, lockedUntil });
          observer.complete();
        }
      });
    });
  }

  /**
   * Cierra sesión y limpia todos los datos
   */
  logout(): void {
    const token = localStorage.getItem(this.SESSION_KEY);
    if (token) {
      this.apiService.post('/auth/logout', {}).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem(this.SESSION_KEY);
    this.router.navigate(['/login']);
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): Observable<boolean> {
    return new Observable(observer => {
      const token = localStorage.getItem(this.SESSION_KEY);
      if (!token) {
        observer.next(false);
        observer.complete();
        return;
      }

      this.apiService.get<any>('/auth/verify').subscribe({
        next: (response) => {
          if (response.user) {
            this.currentUserSubject.next(response.user);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            observer.next(true);
          } else {
            observer.next(false);
          }
          observer.complete();
        },
        error: () => {
          this.logout();
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Carga el usuario almacenado si la sesión es válida
   */
  private loadStoredUser(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        
        // Verificar que la sesión sigue siendo válida
        this.isAuthenticated().subscribe();
      } catch (error) {
        this.logout();
      }
    }
  }

  /**
   * Obtiene el tiempo restante de sesión en minutos
   */
  getSessionTimeRemaining(): number {
    // En el backend, las sesiones duran 8 horas
    // Por simplicidad, retornamos un valor fijo
    // En producción, podrías obtener esto del backend
    return 480; // 8 horas en minutos
  }
}
