import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  username = '';
  password = '';
  error = '';
  loading = false;
  lockedUntil: number | null = null;
  remainingTime: number = 0;
  showPassword = false;
  private countdownInterval?: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    this.checkLockStatus();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  checkLockStatus(): void {
    // Verificar si hay un bloqueo activo
    const attempts = localStorage.getItem('prestamos_login_attempts');
    if (attempts) {
      try {
        const attemptsData = JSON.parse(attempts);
        const userAttempt = attemptsData[this.username.toLowerCase()];
        if (userAttempt?.lockedUntil && userAttempt.lockedUntil > Date.now()) {
          this.lockedUntil = userAttempt.lockedUntil;
          this.startCountdown();
        }
      } catch (e) {
        // Ignorar errores de parsing
      }
    }
  }

  startCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      if (this.lockedUntil) {
        const remaining = Math.ceil((this.lockedUntil - Date.now()) / 1000);
        if (remaining > 0) {
          this.remainingTime = remaining;
        } else {
          this.lockedUntil = null;
          this.remainingTime = 0;
          clearInterval(this.countdownInterval);
        }
      }
    }, 1000);
  }

  onSubmit(): void {
    this.error = '';
    this.loading = true;

    // Validación básica
    if (!this.username.trim() || !this.password.trim()) {
      this.error = 'Por favor, complete todos los campos';
      this.loading = false;
      this.toastService.error('Por favor, complete todos los campos');
      return;
    }

    // Validar longitud mínima
    if (this.password.length < 4) {
      this.error = 'La contraseña debe tener al menos 4 caracteres';
      this.loading = false;
      this.toastService.error('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    // Intentar login (sin delay artificial)
    const result = this.authService.login(this.username.trim(), this.password);
    
    if (result.success) {
      this.toastService.success('Inicio de sesión exitoso');
      this.router.navigate(['/']);
    } else {
      this.error = result.message || 'Error al iniciar sesión';
      this.loading = false;
      
      if (result.lockedUntil) {
        this.lockedUntil = result.lockedUntil;
        this.startCountdown();
        this.toastService.error(this.error);
      } else {
        this.toastService.error(this.error);
      }
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}

