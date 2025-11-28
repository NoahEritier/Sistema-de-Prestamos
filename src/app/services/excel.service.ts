import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  constructor(private storageService: StorageService) {}

  exportToExcel(): void {
    const clients = this.storageService.getClients();
    const loans = this.storageService.getLoans();
    const payments = this.storageService.getPayments();

    // Crear workbook
    const workbook = XLSX.utils.book_new();

    // Hoja de Clientes
    const clientsData = clients.map(c => ({
      'ID': c.id,
      'Nombre': c.nombre,
      'Apellido': c.apellido,
      'Documento': c.documento,
      'Teléfono': c.telefono,
      'Email': c.email,
      'Dirección': c.direccion,
      'Fecha Registro': new Date(c.fechaRegistro).toLocaleDateString('es-AR'),
      'Activo': c.activo ? 'Sí' : 'No'
    }));
    const clientsSheet = XLSX.utils.json_to_sheet(clientsData);
    XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Clientes');

    // Hoja de Préstamos
    const loansData = loans.map(l => ({
      'ID': l.id,
      'Cliente': l.clienteNombre,
      'Monto': l.monto,
      'Tasa Interés': `${l.tasaInteres}%`,
      'Tipo Plazo': l.tipoPlazo,
      'Cantidad Cuotas': l.cantidadCuotas,
      'Fecha Inicio': new Date(l.fechaInicio).toLocaleDateString('es-AR'),
      'Fecha Vencimiento': new Date(l.fechaVencimiento).toLocaleDateString('es-AR'),
      'Estado': l.estado,
      'Monto Pendiente': l.montoPendiente,
      'Cuota': l.cuotaMensual,
      'Cuotas Pagadas': l.cuotasPagadas,
      'Cuotas Totales': l.cuotasTotales
    }));
    const loansSheet = XLSX.utils.json_to_sheet(loansData);
    XLSX.utils.book_append_sheet(workbook, loansSheet, 'Préstamos');

    // Hoja de Pagos
    const paymentsData = payments.map(p => ({
      'ID': p.id,
      'Cliente': p.clienteNombre,
      'Préstamo ID': p.prestamoId,
      'Monto': p.monto,
      'Fecha': new Date(p.fecha).toLocaleDateString('es-AR'),
      'Tipo': p.tipo === 'cuota' ? 'Cuota' : p.tipo === 'abono' ? 'Abono' : 'Pago Completo',
      'Número Cuota': p.numeroCuota || '-',
      'Observaciones': p.observaciones || '-'
    }));
    const paymentsSheet = XLSX.utils.json_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Pagos');

    // Generar archivo
    const fileName = `prestamos_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  importFromExcel(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Leer hojas
          if (workbook.SheetNames.includes('Clientes')) {
            const clientsSheet = workbook.Sheets['Clientes'];
            const clients = XLSX.utils.sheet_to_json(clientsSheet);
            // Aquí podrías procesar e importar los clientes
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}

