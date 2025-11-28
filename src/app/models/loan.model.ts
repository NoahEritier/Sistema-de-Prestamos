export interface Loan {
  id: string;
  clienteId: string;
  clienteNombre: string;
  monto: number;
  tasaInteres: number;
  tipoPlazo: 'semanal' | 'quincenal' | 'mensual';
  cantidadCuotas: number;
  fechaInicio: string;
  fechaVencimiento: string;
  estado: 'activo' | 'completado' | 'vencido' | 'cancelado';
  montoPendiente: number;
  cuotaMensual: number;
  cuotasPagadas: number;
  cuotasTotales: number;
  cuotas: Cuota[];
}

export interface Cuota {
  numero: number;
  monto: number;
  fechaVencimiento: string;
  fechaPago?: string;
  estado: 'pendiente' | 'pagada' | 'vencida';
  montoPagado?: number;
}

