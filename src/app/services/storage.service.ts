import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { User } from '../models/user.model';
import { Client } from '../models/client.model';
import { Loan } from '../models/loan.model';
import { Payment } from '../models/payment.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(private apiService: ApiService) {}

  // Usuarios
  getUsers(): Observable<User[]> {
    return this.apiService.get<User[]>('/users');
  }

  // Clientes
  getClients(): Observable<Client[]> {
    return this.apiService.get<Client[]>('/clients');
  }

  addClient(client: Client): Observable<any> {
    return this.apiService.post('/clients', client);
  }

  updateClient(client: Client): Observable<any> {
    return this.apiService.put(`/clients/${client.id}`, client);
  }

  deleteClient(id: string): Observable<any> {
    return this.apiService.delete(`/clients/${id}`);
  }

  // Préstamos
  getLoans(): Observable<Loan[]> {
    return this.apiService.get<Loan[]>('/loans');
  }

  addLoan(loan: Loan): Observable<any> {
    return this.apiService.post('/loans', loan);
  }

  updateLoan(loan: Loan): Observable<any> {
    return this.apiService.put(`/loans/${loan.id}`, loan);
  }

  // Pagos
  getPayments(): Observable<Payment[]> {
    return this.apiService.get<Payment[]>('/payments');
  }

  addPayment(payment: Payment): Observable<any> {
    return this.apiService.post('/payments', payment);
  }

  // Exportar datos a JSON (para compatibilidad)
  exportToJSON(): Observable<string> {
    return new Observable(observer => {
      Promise.all([
        this.getUsers().toPromise(),
        this.getClients().toPromise(),
        this.getLoans().toPromise(),
        this.getPayments().toPromise()
      ]).then(([users, clients, loans, payments]) => {
        const data = {
          users: users || [],
          clients: clients || [],
          loans: loans || [],
          payments: payments || []
        };
        observer.next(JSON.stringify(data, null, 2));
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }
}
