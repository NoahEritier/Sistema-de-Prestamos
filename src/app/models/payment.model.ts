export interface Payment {
  id: string;
  prestamoId: string;
  clienteId: string;
  clienteNombre: string;
  monto: number;
  fecha: string;
  tipo: 'cuota' | 'abono' | 'pago_completo';
  numeroCuota?: number;
  observaciones?: string;
}

