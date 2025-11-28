import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { LoanService } from '../../services/loan.service';
import { ToastService } from '../../services/toast.service';
import { Client } from '../../models/client.model';
import { HeaderComponent } from '../header/header.component';
import { ToastComponent } from '../toast/toast.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, ToastComponent, ConfirmDialogComponent],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  showModal = false;
  editingClient: Client | null = null;
  clientForm: Partial<Client> = {};
  showConfirmDialog = false;
  clientToDelete: Client | null = null;

  constructor(
    private storageService: StorageService,
    private loanService: LoanService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.clients = this.storageService.getClients();
  }

  openModal(client?: Client): void {
    if (client) {
      this.editingClient = client;
      this.clientForm = { ...client };
    } else {
      this.editingClient = null;
      this.clientForm = {
        nombre: '',
        apellido: '',
        documento: '',
        telefono: '',
        email: '',
        direccion: '',
        activo: true
      };
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingClient = null;
    this.clientForm = {};
  }

  saveClient(): void {
    if (!this.clientForm.nombre || !this.clientForm.apellido || !this.clientForm.documento) {
      this.toastService.error('Por favor complete los campos obligatorios');
      return;
    }

    if (this.editingClient) {
      const updatedClient: Client = {
        ...this.editingClient,
        ...this.clientForm
      } as Client;
      this.storageService.updateClient(updatedClient);
      this.toastService.success('Cliente actualizado exitosamente');
    } else {
      const newClient: Client = {
        id: this.generateId(),
        nombre: this.clientForm.nombre!,
        apellido: this.clientForm.apellido!,
        documento: this.clientForm.documento!,
        telefono: this.clientForm.telefono || '',
        email: this.clientForm.email || '',
        direccion: this.clientForm.direccion || '',
        fechaRegistro: new Date().toISOString(),
        activo: this.clientForm.activo ?? true
      };
      this.storageService.addClient(newClient);
      this.toastService.success('Cliente creado exitosamente');
    }

    this.loadClients();
    this.closeModal();
  }

  deleteClient(id: string): void {
    const client = this.clients.find(c => c.id === id);
    if (!client) return;

    // Verificar si tiene préstamos activos
    const loans = this.loanService.getLoansByClient(id);
    const activeLoans = loans.filter(l => l.estado === 'activo' || l.estado === 'vencido');
    
    if (activeLoans.length > 0) {
      this.toastService.error(
        `No se puede eliminar el cliente. Tiene ${activeLoans.length} préstamo(s) activo(s) o vencido(s).`
      );
      return;
    }

    // Mostrar confirmación
    this.clientToDelete = client;
    this.showConfirmDialog = true;
  }

  confirmDelete(): void {
    if (this.clientToDelete) {
      this.storageService.deleteClient(this.clientToDelete.id);
      this.loadClients();
      this.toastService.success(`Cliente ${this.clientToDelete.nombre} ${this.clientToDelete.apellido} eliminado`);
      this.clientToDelete = null;
    }
    this.showConfirmDialog = false;
  }

  cancelDelete(): void {
    this.clientToDelete = null;
    this.showConfirmDialog = false;
  }

  toggleClientStatus(client: Client): void {
    client.activo = !client.activo;
    this.storageService.updateClient(client);
    this.loadClients();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

