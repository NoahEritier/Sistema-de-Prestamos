import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { LoanService } from '../../services/loan.service';
import { ToastService } from '../../services/toast.service';
import { ReceiptService } from '../../services/receipt.service';
import { Loan } from '../../models/loan.model';
import { Client } from '../../models/client.model';
import { HeaderComponent } from '../header/header.component';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, HeaderComponent, ToastComponent],
  templateUrl: './loans.component.html',
  styleUrls: ['./loans.component.scss']
})
export class LoansComponent implements OnInit {
  loans: Loan[] = [];
  clients: Client[] = [];
  showModal = false;
  editingLoan: Loan | null = null;
  loanForm: any = {};

  showDetailModal = false;
  selectedLoan: Loan | null = null;

  constructor(
    private storageService: StorageService,
    private loanService: LoanService,
    private toastService: ToastService,
    private receiptService: ReceiptService
  ) {}

  ngOnInit(): void {
    this.loadLoans();
    this.loadClients();
  }

  loadLoans(): void {
    this.loans = this.storageService.getLoans();
  }

  loadClients(): void {
    this.clients = this.storageService.getClients().filter(c => c.activo);
  }

  openModal(loan?: Loan): void {
    if (loan) {
      this.editingLoan = loan;
      this.loanForm = { ...loan };
    } else {
      this.editingLoan = null;
      this.loanForm = {
        clienteId: '',
        monto: 0,
        tasaInteres: 0,
        tipoPlazo: 'mensual',
        cantidadCuotas: 1,
        fechaInicio: new Date().toISOString().split('T')[0],
        estado: 'activo'
      };
    }
    this.showModal = true;
  }

  openDetailModal(loan: Loan): void {
    // Recargar el préstamo actualizado desde el storage
    const updatedLoan = this.storageService.getLoans().find(l => l.id === loan.id);
    this.selectedLoan = updatedLoan || loan;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedLoan = null;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingLoan = null;
    this.loanForm = {};
  }

  calculatePayment(): void {
    if (this.loanForm.monto && this.loanForm.tasaInteres && this.loanForm.cantidadCuotas && this.loanForm.tipoPlazo) {
      this.loanForm.cuotaMensual = this.loanService.calculatePaymentAmount(
        this.loanForm.monto,
        this.loanForm.tasaInteres,
        this.loanForm.cantidadCuotas,
        this.loanForm.tipoPlazo
      );
    }
  }

  saveLoan(): void {
    if (!this.loanForm.clienteId || !this.loanForm.monto || !this.loanForm.cantidadCuotas || !this.loanForm.tipoPlazo) {
      this.toastService.error('Por favor complete los campos obligatorios');
      return;
    }

    const client = this.clients.find(c => c.id === this.loanForm.clienteId);
    if (!client) {
      this.toastService.error('Cliente no encontrado');
      return;
    }

    if (this.editingLoan) {
      this.toastService.warning('La edición de préstamos no está permitida por el momento');
      this.closeModal();
      return;
    }

    const fechaInicio = new Date(this.loanForm.fechaInicio);

      const newLoan = this.loanService.createLoan({
        clienteId: this.loanForm.clienteId,
        clienteNombre: `${client.nombre} ${client.apellido}`,
        monto: this.loanForm.monto,
        tasaInteres: this.loanForm.tasaInteres || 0,
        tipoPlazo: this.loanForm.tipoPlazo,
        cantidadCuotas: this.loanForm.cantidadCuotas,
        fechaInicio: fechaInicio.toISOString(),
        fechaVencimiento: '', // Se calculará en createLoan
        estado: 'activo',
        cuotasTotales: this.loanForm.cantidadCuotas
      });

      // Generar comprobante de préstamo automáticamente
      setTimeout(() => {
        this.receiptService.generateLoanReceipt(newLoan, client);
        this.toastService.info('Comprobante de préstamo generado');
      }, 100);

    this.toastService.success('Préstamo creado exitosamente');
    this.loadLoans();
    this.closeModal();
  }

  getCuotasRestantes(loan: Loan): number {
    if (!loan.cuotasTotales) return 0;
    return loan.cuotasTotales - (loan.cuotasPagadas || 0);
  }

  generateLoanReceipt(): void {
    if (this.selectedLoan) {
      const client = this.clients.find(c => c.id === this.selectedLoan!.clienteId);
      if (client) {
        this.receiptService.generateLoanReceipt(this.selectedLoan, client);
        this.toastService.success('Comprobante de préstamo generado');
      }
    }
  }

  generatePaymentReceiptForCuota(cuota: any): void {
    if (!this.selectedLoan) return;

    // Buscar el pago correspondiente a esta cuota
    const payments = this.storageService.getPayments();
    const payment = payments.find(p => 
      p.prestamoId === this.selectedLoan!.id && 
      p.numeroCuota === cuota.numero &&
      p.tipo === 'cuota'
    );

    if (payment) {
      const client = this.clients.find(c => c.id === this.selectedLoan!.clienteId);
      if (client) {
        this.receiptService.generatePaymentReceipt(payment, client, this.selectedLoan);
        this.toastService.success('Comprobante de pago generado');
      } else {
        this.toastService.error('Cliente no encontrado');
      }
    } else {
      this.toastService.warning('No se encontró el registro de pago para esta cuota');
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'activo': return 'badge-warning';
      case 'completado': return 'badge-success';
      case 'vencido': return 'badge-danger';
      default: return 'badge-info';
    }
  }
}

