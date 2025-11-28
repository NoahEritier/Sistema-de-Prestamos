import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { LoanService } from '../../services/loan.service';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { ExcelService } from '../../services/excel.service';
import { ToastService } from '../../services/toast.service';
import { HeaderComponent } from '../header/header.component';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, HeaderComponent, NgChartsModule, ToastComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  metrics: any = {};
  recentLoans: any[] = [];
  recentPayments: any[] = [];

  // Gráfico de estado de cuotas
  cuotasChartData: ChartData<'doughnut'> = {
    labels: ['Pagadas', 'Pendientes', 'Vencidas'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#28A745', '#FFC107', '#DC3545'],
      borderWidth: 0
    }]
  };
  cuotasChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Gráfico de préstamos por estado
  prestamosChartData: ChartData<'bar'> = {
    labels: ['Activos', 'Completados', 'Vencidos', 'Cancelados'],
    datasets: [{
      label: 'Cantidad',
      data: [0, 0, 0, 0],
      backgroundColor: ['#FFC107', '#28A745', '#DC3545', '#6C757D']
    }]
  };
  prestamosChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // Gráfico de evolución de pagos (últimos 6 meses)
  pagosChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Monto Recuperado',
      data: [],
      borderColor: '#8B1538',
      backgroundColor: 'rgba(139, 21, 56, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };
  pagosChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  constructor(
    private loanService: LoanService,
    private storageService: StorageService,
    private excelService: ExcelService,
    private toastService: ToastService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMetrics();
    this.loadRecentData();
    this.loadChartsData();
  }

  loadMetrics(): void {
    this.metrics = this.loanService.getDashboardMetrics();
  }

  loadChartsData(): void {
    const loans = this.storageService.getLoans();
    const payments = this.storageService.getPayments();

    // Calcular datos de cuotas
    let cuotasPagadas = 0;
    let cuotasPendientes = 0;
    let cuotasVencidas = 0;

    loans.forEach(loan => {
      if (loan.cuotas) {
        loan.cuotas.forEach(cuota => {
          if (cuota.estado === 'pagada') cuotasPagadas++;
          else if (cuota.estado === 'vencida') cuotasVencidas++;
          else cuotasPendientes++;
        });
      }
    });

    this.cuotasChartData.datasets[0].data = [cuotasPagadas, cuotasPendientes, cuotasVencidas];

    // Calcular préstamos por estado
    const activos = loans.filter(l => l.estado === 'activo').length;
    const completados = loans.filter(l => l.estado === 'completado').length;
    const vencidos = loans.filter(l => l.estado === 'vencido').length;
    const cancelados = loans.filter(l => l.estado === 'cancelado').length;

    this.prestamosChartData.datasets[0].data = [activos, completados, vencidos, cancelados];

    // Calcular evolución de pagos (últimos 6 meses)
    const meses = [];
    const montos = [];
    const hoy = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const mesNombre = fecha.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
      meses.push(mesNombre);
      
      const montoMes = payments
        .filter(p => {
          const fechaPago = new Date(p.fecha);
          return fechaPago.getMonth() === fecha.getMonth() && 
                 fechaPago.getFullYear() === fecha.getFullYear();
        })
        .reduce((sum, p) => sum + p.monto, 0);
      
      montos.push(montoMes);
    }

    this.pagosChartData.labels = meses;
    this.pagosChartData.datasets[0].data = montos;
  }

  exportToExcel(): void {
    try {
      this.excelService.exportToExcel();
      this.toastService.success('Datos exportados a Excel exitosamente');
    } catch (error) {
      this.toastService.error('Error al exportar datos');
    }
  }

  loadRecentData(): void {
    // Cargar préstamos recientes
    const loans = this.storageService.getLoans();
    this.recentLoans = loans
      .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())
      .slice(0, 5);

    // Cargar pagos recientes
    const payments = this.storageService.getPayments();
    this.recentPayments = payments
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  }
}

