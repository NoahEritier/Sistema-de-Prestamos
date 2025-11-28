import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'clientes',
    loadComponent: () => import('./components/clients/clients.component').then(m => m.ClientsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'prestamos',
    loadComponent: () => import('./components/loans/loans.component').then(m => m.LoansComponent),
    canActivate: [authGuard]
  },
  {
    path: 'pagos',
    loadComponent: () => import('./components/payments/payments.component').then(m => m.PaymentsComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

