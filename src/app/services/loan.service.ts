import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Loan, Cuota } from '../models/loan.model';
import { Payment } from '../models/payment.model';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  constructor(private storageService: StorageService) {
    this.checkVencidos();
    // Verificar vencidos cada hora
    setInterval(() => this.checkVencidos(), 3600000);
  }

  calculatePaymentAmount(monto: number, tasaInteres: number, cantidadCuotas: number, tipoPlazo: 'semanal' | 'quincenal' | 'mensual'): number {
    let periodosPorAno = 0;
    switch (tipoPlazo) {
      case 'semanal':
        periodosPorAno = 52;
        break;
      case 'quincenal':
        periodosPorAno = 24;
        break;
      case 'mensual':
        periodosPorAno = 12;
        break;
    }

    const tasaPeriodica = tasaInteres / 100 / periodosPorAno;
    if (tasaPeriodica === 0) {
      return monto / cantidadCuotas;
    }
    return monto * (tasaPeriodica * Math.pow(1 + tasaPeriodica, cantidadCuotas)) / 
           (Math.pow(1 + tasaPeriodica, cantidadCuotas) - 1);
  }

  generateCuotas(fechaInicio: string, cantidadCuotas: number, tipoPlazo: 'semanal' | 'quincenal' | 'mensual', montoCuota: number): Cuota[] {
    const cuotas: Cuota[] = [];
    const fecha = new Date(fechaInicio);
    
    for (let i = 1; i <= cantidadCuotas; i++) {
      const fechaVencimiento = new Date(fecha);
      
      switch (tipoPlazo) {
        case 'semanal':
          fechaVencimiento.setDate(fecha.getDate() + (i * 7));
          break;
        case 'quincenal':
          fechaVencimiento.setDate(fecha.getDate() + (i * 15));
          break;
        case 'mensual':
          fechaVencimiento.setMonth(fecha.getMonth() + i);
          break;
      }
      
      cuotas.push({
        numero: i,
        monto: montoCuota,
        fechaVencimiento: fechaVencimiento.toISOString(),
        estado: 'pendiente'
      });
    }
    
    return cuotas;
  }

  createLoan(loan: Omit<Loan, 'id' | 'montoPendiente' | 'cuotaMensual' | 'cuotasPagadas' | 'cuotas'>): Loan {
    const montoCuota = this.calculatePaymentAmount(loan.monto, loan.tasaInteres, loan.cantidadCuotas, loan.tipoPlazo);
    const cuotas = this.generateCuotas(loan.fechaInicio, loan.cantidadCuotas, loan.tipoPlazo, montoCuota);
    
    // Calcular fecha de vencimiento (última cuota)
    const fechaVencimiento = cuotas.length > 0 ? cuotas[cuotas.length - 1].fechaVencimiento : loan.fechaVencimiento;
    
    const newLoan: Loan = {
      ...loan,
      id: this.generateId(),
      montoPendiente: loan.monto,
      cuotaMensual: montoCuota,
      cuotasPagadas: 0,
      cuotasTotales: loan.cantidadCuotas,
      cuotas,
      fechaVencimiento
    };
    
    this.storageService.addLoan(newLoan);
    return newLoan;
  }

  checkVencidos(): void {
    const loans = this.storageService.getLoans();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    loans.forEach(loan => {
      if (loan.estado === 'activo' || loan.estado === 'vencido') {
        // Asegurar que el array de cuotas existe
        if (!loan.cuotas) {
          loan.cuotas = [];
        }
        
        let tieneVencidas = false;
        
        loan.cuotas.forEach(cuota => {
          if (cuota.estado === 'pendiente') {
            const fechaVenc = new Date(cuota.fechaVencimiento);
            fechaVenc.setHours(0, 0, 0, 0);
            
            if (fechaVenc < hoy) {
              cuota.estado = 'vencida';
              tieneVencidas = true;
            }
          }
        });
        
        if (tieneVencidas && loan.estado === 'activo') {
          loan.estado = 'vencido';
          this.storageService.updateLoan(loan);
        }
      }
    });
  }

  registerPayment(payment: Omit<Payment, 'id'>): void {
    const newPayment: Payment = {
      ...payment,
      id: this.generateId()
    };
    
    this.storageService.addPayment(newPayment);
    
    // Actualizar préstamo
    const loan = this.storageService.getLoans().find(l => l.id === payment.prestamoId);
    if (loan) {
      // Asegurar que el array de cuotas existe
      if (!loan.cuotas) {
        loan.cuotas = [];
      }
      
      loan.montoPendiente = Math.max(0, loan.montoPendiente - payment.monto);
      
      if (payment.tipo === 'cuota' && payment.numeroCuota) {
        const cuota = loan.cuotas.find(c => c.numero === payment.numeroCuota);
        if (cuota) {
          cuota.estado = 'pagada';
          cuota.fechaPago = payment.fecha;
          cuota.montoPagado = payment.monto;
          loan.cuotasPagadas = (loan.cuotasPagadas || 0) + 1;
        }
      } else if (payment.tipo === 'abono') {
        // Para abonos, no se marca ninguna cuota específica como pagada
        // pero se reduce el monto pendiente
      } else if (payment.tipo === 'pago_completo') {
        loan.cuotas.forEach(cuota => {
          if (cuota.estado !== 'pagada') {
            cuota.estado = 'pagada';
            cuota.fechaPago = payment.fecha;
            cuota.montoPagado = cuota.monto;
          }
        });
        loan.cuotasPagadas = loan.cuotasTotales;
      }
      
      if (loan.montoPendiente <= 0) {
        loan.estado = 'completado';
        loan.montoPendiente = 0;
      } else {
        // Verificar si aún hay cuotas vencidas
        this.checkVencidos();
      }
      
      this.storageService.updateLoan(loan);
    }
  }

  getLoansByClient(clientId: string): Loan[] {
    return this.storageService.getLoans().filter(l => l.clienteId === clientId);
  }

  getLoansByClientId(clientId: string): Loan[] {
    return this.getLoansByClient(clientId);
  }

  getPaymentsByLoan(loanId: string): Payment[] {
    return this.storageService.getPayments().filter(p => p.prestamoId === loanId);
  }

  getDashboardMetrics() {
    const loans = this.storageService.getLoans();
    const payments = this.storageService.getPayments();
    const clients = this.storageService.getClients();

    const totalPrestamos = loans.reduce((sum, l) => sum + l.monto, 0);
    const totalPendiente = loans
      .filter(l => l.estado === 'activo')
      .reduce((sum, l) => sum + l.montoPendiente, 0);
    const totalRecuperado = payments.reduce((sum, p) => sum + p.monto, 0);
    const prestamosActivos = loans.filter(l => l.estado === 'activo').length;
    const prestamosVencidos = loans.filter(l => l.estado === 'vencido').length;
    const clientesActivos = clients.filter(c => c.activo).length;

    return {
      totalPrestamos,
      totalPendiente,
      totalRecuperado,
      prestamosActivos,
      prestamosVencidos,
      clientesActivos,
      totalClientes: clients.length,
      totalPrestamosCount: loans.length
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

