import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { LoanService } from '../../services/loan.service';
import { ReceiptService } from '../../services/receipt.service';
import { ToastService } from '../../services/toast.service';
import { Payment } from '../../models/payment.model';
import { Loan } from '../../models/loan.model';
import { Client } from '../../models/client.model';
import { HeaderComponent } from '../header/header.component';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, HeaderComponent, ToastComponent],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit {
  payments: Payment[] = [];
  loans: Loan[] = [];
  showModal = false;
  paymentForm: any = {};

  constructor(
    private storageService: StorageService,
    private loanService: LoanService,
    private receiptService: ReceiptService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadPayments();
    this.loadLoans();
  }

  loadPayments(): void {
    this.payments = this.storageService.getPayments();
  }

  loadLoans(): void {
    // Incluir préstamos activos y vencidos para poder registrar pagos
    this.loans = this.storageService.getLoans().filter(l => 
      l.estado === 'activo' || l.estado === 'vencido'
    );
  }

  openModal(): void {
    this.paymentForm = {
      prestamoId: '',
      monto: 0,
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'cuota',
      numeroCuota: 1,
      observaciones: ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.paymentForm = {};
  }

  onLoanChange(): void {
    const loan = this.loans.find(l => l.id === this.paymentForm.prestamoId);
    if (loan) {
      this.paymentForm.monto = loan.cuotaMensual;
      this.paymentForm.clienteId = loan.clienteId;
      this.paymentForm.clienteNombre = loan.clienteNombre;
      this.paymentForm.numeroCuota = loan.cuotasPagadas + 1;
    }
  }

  savePayment(): void {
    if (!this.paymentForm.prestamoId || !this.paymentForm.monto) {
      this.toastService.error('Por favor complete los campos obligatorios');
      return;
    }

    const loan = this.loans.find(l => l.id === this.paymentForm.prestamoId);
    if (!loan) return;

    const payment: Omit<Payment, 'id'> = {
      prestamoId: this.paymentForm.prestamoId,
      clienteId: loan.clienteId,
      clienteNombre: loan.clienteNombre,
      monto: this.paymentForm.monto,
      fecha: new Date(this.paymentForm.fecha).toISOString(),
      tipo: this.paymentForm.tipo,
      numeroCuota: this.paymentForm.tipo === 'cuota' ? this.paymentForm.numeroCuota : undefined,
      observaciones: this.paymentForm.observaciones || undefined
    };

    this.loanService.registerPayment(payment);
    
    // Recargar datos actualizados
    this.loadPayments();
    this.loadLoans();

    this.toastService.success('Pago registrado exitosamente');

    // Generar comprobante
    const client = this.storageService.getClients().find(c => c.id === loan.clienteId);
    if (client) {
      setTimeout(() => {
        const savedPayment = this.storageService.getPayments().find(p => 
          p.prestamoId === payment.prestamoId && 
          p.monto === payment.monto &&
          Math.abs(new Date(p.fecha).getTime() - new Date(payment.fecha).getTime()) < 1000
        );
        if (savedPayment) {
          this.receiptService.generatePaymentReceipt(savedPayment, client, loan);
          this.toastService.info('Comprobante generado');
        }
      }, 100);
    }

    this.closeModal();
  }

  generateReceipt(payment: Payment): void {
    const loan = this.storageService.getLoans().find(l => l.id === payment.prestamoId);
    const client = this.storageService.getClients().find(c => c.id === payment.clienteId);
    
    if (loan && client) {
      this.receiptService.generatePaymentReceipt(payment, client, loan);
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  }

  getPaymentTypeLabel(tipo: string): string {
    switch (tipo) {
      case 'cuota': return 'Cuota';
      case 'abono': return 'Abono';
      case 'pago_completo': return 'Pago Completo';
      default: return tipo;
    }
  }
}

