import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Client } from '../models/client.model';
import { Loan } from '../models/loan.model';
import { Payment } from '../models/payment.model';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_PREFIX = 'prestamos_';
  private readonly SECRET_KEY = 'prestamos-secret-key-2024';

  constructor() {
    this.initializeData();
  }

  private initializeData(): void {
    const users = this.getUsers();
    
    // Generar hash seguro para la contraseña usando PBKDF2 con salt
    const salt = 'prestamos-salt-2024-secure';
    const password = '2Ye3r!R4';
    const passwordHash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 1000
    }).toString();

    // Si no hay usuarios, crear el usuario por defecto
    if (!users.length) {
      const defaultUsers: User[] = [
        {
          id: '1',
          username: 'damian',
          passwordHash: passwordHash,
          name: 'Damian',
          email: 'damian@prestamos.com'
        }
      ];
      this.saveUsers(defaultUsers);
    } else {
      // Si ya hay usuarios, actualizar el usuario 'damian' si existe
      const damianUser = users.find(u => u.username === 'damian' || u.username === 'admin');
      if (damianUser) {
        damianUser.username = 'damian';
        damianUser.passwordHash = passwordHash;
        damianUser.name = 'Damian';
        damianUser.email = 'damian@prestamos.com';
        this.saveUsers(users);
      } else {
        // Si no existe, agregarlo
        users.push({
          id: '1',
          username: 'damian',
          passwordHash: passwordHash,
          name: 'Damian',
          email: 'damian@prestamos.com'
        });
        this.saveUsers(users);
      }
    }
  }

  // Usuarios
  getUsers(): User[] {
    const data = localStorage.getItem(this.STORAGE_PREFIX + 'users');
    return data ? JSON.parse(data) : [];
  }

  saveUsers(users: User[]): void {
    localStorage.setItem(this.STORAGE_PREFIX + 'users', JSON.stringify(users));
  }

  // Clientes
  getClients(): Client[] {
    const data = localStorage.getItem(this.STORAGE_PREFIX + 'clients');
    return data ? JSON.parse(data) : [];
  }

  saveClients(clients: Client[]): void {
    localStorage.setItem(this.STORAGE_PREFIX + 'clients', JSON.stringify(clients));
  }

  addClient(client: Client): void {
    const clients = this.getClients();
    clients.push(client);
    this.saveClients(clients);
  }

  updateClient(client: Client): void {
    const clients = this.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    if (index !== -1) {
      clients[index] = client;
      this.saveClients(clients);
    }
  }

  deleteClient(id: string): void {
    const clients = this.getClients().filter(c => c.id !== id);
    this.saveClients(clients);
  }

  // Préstamos
  getLoans(): Loan[] {
    const data = localStorage.getItem(this.STORAGE_PREFIX + 'loans');
    const loans = data ? JSON.parse(data) : [];
    // Migrar préstamos antiguos que no tengan el campo cuotas
    return loans.map((loan: any) => {
      if (!loan.cuotas) {
        loan.cuotas = [];
        // Si tiene plazoMeses, crear cuotas básicas
        if (loan.plazoMeses && !loan.cantidadCuotas) {
          loan.cantidadCuotas = loan.plazoMeses;
          loan.tipoPlazo = 'mensual';
        }
      }
      return loan;
    });
  }

  saveLoans(loans: Loan[]): void {
    localStorage.setItem(this.STORAGE_PREFIX + 'loans', JSON.stringify(loans));
  }

  addLoan(loan: Loan): void {
    const loans = this.getLoans();
    loans.push(loan);
    this.saveLoans(loans);
  }

  updateLoan(loan: Loan): void {
    const loans = this.getLoans();
    const index = loans.findIndex(l => l.id === loan.id);
    if (index !== -1) {
      loans[index] = loan;
      this.saveLoans(loans);
    }
  }

  // Pagos
  getPayments(): Payment[] {
    const data = localStorage.getItem(this.STORAGE_PREFIX + 'payments');
    return data ? JSON.parse(data) : [];
  }

  savePayments(payments: Payment[]): void {
    localStorage.setItem(this.STORAGE_PREFIX + 'payments', JSON.stringify(payments));
  }

  addPayment(payment: Payment): void {
    const payments = this.getPayments();
    payments.push(payment);
    this.savePayments(payments);
  }

  // Exportar datos a JSON
  exportToJSON(): string {
    return JSON.stringify({
      users: this.getUsers(),
      clients: this.getClients(),
      loans: this.getLoans(),
      payments: this.getPayments()
    }, null, 2);
  }

  // Importar datos desde JSON
  importFromJSON(json: string): void {
    try {
      const data = JSON.parse(json);
      if (data.users) this.saveUsers(data.users);
      if (data.clients) this.saveClients(data.clients);
      if (data.loans) this.saveLoans(data.loans);
      if (data.payments) this.savePayments(data.payments);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Formato JSON inválido');
    }
  }
}

