import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { User } from '../models/user.model';
import { StorageService } from './storage.service';

interface LoginAttempt {
  username: string;
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

interface SessionData {
  userId: string;
  username: string;
  token: string;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos
  private readonly SALT = 'prestamos-salt-2024-secure';
  private readonly SESSION_KEY = 'prestamos_session';
  private readonly ATTEMPTS_KEY = 'prestamos_login_attempts';

  constructor(
    private router: Router,
    private storageService: StorageService
  ) {
    this.loadStoredUser();
    this.checkSessionExpiry();
    // Verificar sesión cada minuto
    setInterval(() => this.checkSessionExpiry(), 60000);
  }

  /**
   * Hash de contraseña con salt usando PBKDF2 (optimizado para velocidad)
   */
  private hashPassword(password: string, salt?: string): string {
    const usedSalt = salt || this.SALT;
    // Usar PBKDF2 con 1000 iteraciones (balance entre seguridad y velocidad)
    return CryptoJS.PBKDF2(password, usedSalt, {
      keySize: 256 / 32,
      iterations: 1000
    }).toString();
  }

  /**
   * Genera un token de sesión seguro
   */
  private generateSessionToken(): string {
    const randomBytes = CryptoJS.lib.WordArray.random(32);
    return CryptoJS.SHA256(randomBytes + Date.now().toString()).toString();
  }

  /**
   * Verifica si un usuario está bloqueado por intentos fallidos
   */
  private isUserLocked(username: string): boolean {
    const attempts = this.getLoginAttempts();
    const userAttempt = attempts[username];
    
    if (!userAttempt) return false;
    
    if (userAttempt.lockedUntil && userAttempt.lockedUntil > Date.now()) {
      return true;
    }
    
    // Limpiar si el bloqueo expiró
    if (userAttempt.lockedUntil && userAttempt.lockedUntil <= Date.now()) {
      delete attempts[username];
      this.saveLoginAttempts(attempts);
      return false;
    }
    
    return false;
  }

  /**
   * Registra un intento de login fallido
   */
  private recordFailedAttempt(username: string): void {
    const attempts = this.getLoginAttempts();
    
    if (!attempts[username]) {
      attempts[username] = {
        username,
        attempts: 0,
        lastAttempt: Date.now()
      };
    }
    
    attempts[username].attempts += 1;
    attempts[username].lastAttempt = Date.now();
    
    // Bloquear si excede el límite
    if (attempts[username].attempts >= this.MAX_LOGIN_ATTEMPTS) {
      attempts[username].lockedUntil = Date.now() + this.LOCKOUT_DURATION;
    }
    
    this.saveLoginAttempts(attempts);
  }

  /**
   * Limpia los intentos fallidos de un usuario
   */
  private clearFailedAttempts(username: string): void {
    const attempts = this.getLoginAttempts();
    delete attempts[username];
    this.saveLoginAttempts(attempts);
  }

  /**
   * Obtiene los intentos de login almacenados
   */
  private getLoginAttempts(): { [key: string]: LoginAttempt } {
    const data = localStorage.getItem(this.ATTEMPTS_KEY);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Guarda los intentos de login
   */
  private saveLoginAttempts(attempts: { [key: string]: LoginAttempt }): void {
    localStorage.setItem(this.ATTEMPTS_KEY, JSON.stringify(attempts));
  }

  /**
   * Valida y sanitiza el input
   */
  private validateInput(input: string): boolean {
    if (!input || input.trim().length === 0) return false;
    if (input.length > 100) return false; // Prevenir inputs muy largos
    // Prevenir caracteres peligrosos
    const dangerousChars = /[<>\"'%;()&+]/;
    return !dangerousChars.test(input);
  }

  /**
   * Intento de login con validaciones de seguridad
   */
  login(username: string, password: string): { success: boolean; message?: string; lockedUntil?: number } {
    // Validar inputs
    if (!this.validateInput(username) || !this.validateInput(password)) {
      return { success: false, message: 'Credenciales inválidas' };
    }

    // Verificar si el usuario está bloqueado
    if (this.isUserLocked(username)) {
      const attempts = this.getLoginAttempts();
      const userAttempt = attempts[username];
      const remainingTime = userAttempt?.lockedUntil 
        ? Math.ceil((userAttempt.lockedUntil - Date.now()) / 60000)
        : 0;
      return { 
        success: false, 
        message: `Cuenta bloqueada. Intente nuevamente en ${remainingTime} minutos.`,
        lockedUntil: userAttempt?.lockedUntil
      };
    }

    // Buscar usuario (comparación case-insensitive)
    const users = this.storageService.getUsers();
    const user = users.find(u => u.username.toLowerCase().trim() === username.toLowerCase().trim());
    
    if (!user) {
      this.recordFailedAttempt(username);
      return { success: false, message: 'Usuario o contraseña incorrectos' };
    }

    // Verificar contraseña
    const passwordHash = this.hashPassword(password.trim());
    const storedHash = user.passwordHash.trim();
    
    if (storedHash !== passwordHash) {
      this.recordFailedAttempt(username);
      const attempts = this.getLoginAttempts();
      const remainingAttempts = this.MAX_LOGIN_ATTEMPTS - (attempts[username]?.attempts || 0);
      
      if (remainingAttempts > 0) {
        return { 
          success: false, 
          message: `Usuario o contraseña incorrectos. ${remainingAttempts} intentos restantes.` 
        };
      } else {
        return { 
          success: false, 
          message: 'Cuenta bloqueada por múltiples intentos fallidos',
          lockedUntil: attempts[username]?.lockedUntil
        };
      }
    }

    // Login exitoso
    this.clearFailedAttempts(username);
    
    // Crear sesión segura (optimizado)
    const sessionToken = this.generateSessionToken();
    const expiresAt = Date.now() + this.SESSION_DURATION;
    const sessionData: SessionData = {
      userId: user.id,
      username: user.username,
      token: sessionToken,
      expiresAt
    };

    // Guardar sesión (sin datos sensibles)
    const { passwordHash: _, ...userWithoutPassword } = user;
    this.currentUserSubject.next(user as User);
    
    // Guardar sesión encriptada (hacerlo de forma asíncrona para no bloquear)
    try {
      const encryptedSession = CryptoJS.AES.encrypt(
        JSON.stringify(sessionData),
        this.SALT
      ).toString();
      
      localStorage.setItem(this.SESSION_KEY, encryptedSession);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    } catch (error) {
      console.error('Error guardando sesión:', error);
      return { success: false, message: 'Error al guardar sesión' };
    }

    return { success: true };
  }

  /**
   * Verifica si la sesión está activa y válida
   */
  private checkSessionExpiry(): void {
    const encryptedSession = localStorage.getItem(this.SESSION_KEY);
    if (!encryptedSession) {
      if (this.currentUserSubject.value) {
        this.logout();
      }
      return;
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedSession, this.SALT);
      const sessionData: SessionData = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      
      if (sessionData.expiresAt < Date.now()) {
        this.logout();
        return;
      }

      // Verificar que el usuario aún existe
      const users = this.storageService.getUsers();
      const user = users.find(u => u.id === sessionData.userId);
      if (!user) {
        this.logout();
        return;
      }
    } catch (error) {
      // Sesión corrupta, cerrar sesión
      this.logout();
    }
  }

  /**
   * Cierra sesión y limpia todos los datos
   */
  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem(this.SESSION_KEY);
    this.router.navigate(['/login']);
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    this.checkSessionExpiry();
    return this.currentUserSubject.value !== null;
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
    const encryptedSession = localStorage.getItem(this.SESSION_KEY);
    if (!encryptedSession) return;

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedSession, this.SALT);
      const sessionData: SessionData = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      
      if (sessionData.expiresAt < Date.now()) {
        this.logout();
        return;
      }

      const users = this.storageService.getUsers();
      const fullUser = users.find(u => u.id === sessionData.userId);
      if (fullUser) {
        this.currentUserSubject.next(fullUser);
      } else {
        this.logout();
      }
    } catch (error) {
      this.logout();
    }
  }

  /**
   * Obtiene el tiempo restante de sesión en minutos
   */
  getSessionTimeRemaining(): number {
    const encryptedSession = localStorage.getItem(this.SESSION_KEY);
    if (!encryptedSession) return 0;

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedSession, this.SALT);
      const sessionData: SessionData = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      const remaining = sessionData.expiresAt - Date.now();
      return Math.max(0, Math.floor(remaining / 60000));
    } catch {
      return 0;
    }
  }
}

