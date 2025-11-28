import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { Payment } from '../models/payment.model';
import { Loan } from '../models/loan.model';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  generatePaymentReceipt(payment: Payment, client: Client, loan: Loan): void {
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFillColor(139, 21, 56);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE PAGO', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Sistema de Préstamos', 105, 30, { align: 'center' });

    // Información del comprobante
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let y = 50;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Número de Comprobante:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(payment.id, 80, y);
    
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(payment.fecha).toLocaleDateString('es-ES'), 80, y);
    
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Tipo de Pago:', 20, y);
    doc.setFont('helvetica', 'normal');
    const tipoPago = payment.tipo === 'cuota' ? 'Cuota' : 
                     payment.tipo === 'abono' ? 'Abono' : 'Pago Completo';
    doc.text(tipoPago, 80, y);

    // Información del cliente
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DATOS DEL CLIENTE', 20, y);
    doc.setFontSize(10);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Nombre:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${client.nombre} ${client.apellido}`, 60, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Documento:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(client.documento, 60, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Teléfono:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(client.telefono, 60, y);

    // Información del préstamo
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INFORMACIÓN DEL PRÉSTAMO', 20, y);
    doc.setFontSize(10);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Préstamo ID:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(loan.id, 60, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Monto Original:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${loan.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 60, y);
    
    if (payment.numeroCuota) {
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Cuota Número:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(payment.numeroCuota.toString(), 60, y);
    }

    // Monto pagado
    y += 15;
    doc.setFillColor(139, 21, 56);
    doc.rect(20, y - 5, 170, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MONTO PAGADO', 105, y + 5, { align: 'center' });
    
    y += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(`$${payment.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 105, y, { align: 'center' });

    // Observaciones
    if (payment.observaciones) {
      y += 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Observaciones:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(payment.observaciones, 20, y + 8);
    }

    // Pie de página
    y = 280;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Este es un comprobante generado electrónicamente', 105, y, { align: 'center' });
    doc.text('Sistema de Préstamos - Todos los derechos reservados', 105, y + 5, { align: 'center' });

    doc.save(`comprobante-pago-${payment.id}.pdf`);
  }

  generateLoanReceipt(loan: Loan, client: Client): void {
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFillColor(139, 21, 56);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE PRÉSTAMO', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Sistema de Préstamos', 105, 30, { align: 'center' });

    // Información del comprobante
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let y = 50;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Número de Préstamo:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(loan.id, 80, y);
    
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de Inicio:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(loan.fechaInicio).toLocaleDateString('es-ES'), 80, y);
    
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de Vencimiento:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(loan.fechaVencimiento).toLocaleDateString('es-ES'), 80, y);

    // Información del cliente
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DATOS DEL CLIENTE', 20, y);
    doc.setFontSize(10);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Nombre:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${client.nombre} ${client.apellido}`, 60, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Documento:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(client.documento, 60, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Teléfono:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(client.telefono, 60, y);

    // Detalles del préstamo
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DETALLES DEL PRÉSTAMO', 20, y);
    doc.setFontSize(10);
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Monto del Préstamo:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${loan.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 120, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Tasa de Interés:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${loan.tasaInteres}% anual`, 120, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Plazo:', 20, y);
    doc.setFont('helvetica', 'normal');
    const plazoTexto = loan.cantidadCuotas + ' ' + 
      (loan.tipoPlazo === 'semanal' ? 'semanas' : 
       loan.tipoPlazo === 'quincenal' ? 'quincenas' : 'meses');
    doc.text(plazoTexto, 120, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Cuota Mensual:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${loan.cuotaMensual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 120, y);

    // Monto destacado
    y += 15;
    doc.setFillColor(139, 21, 56);
    doc.rect(20, y - 5, 170, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MONTO TOTAL DEL PRÉSTAMO', 105, y + 5, { align: 'center' });
    
    y += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(`$${loan.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 105, y, { align: 'center' });

    // Pie de página
    y = 280;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Este es un comprobante generado electrónicamente', 105, y, { align: 'center' });
    doc.text('Sistema de Préstamos - Todos los derechos reservados', 105, y + 5, { align: 'center' });

    doc.save(`comprobante-prestamo-${loan.id}.pdf`);
  }
}

