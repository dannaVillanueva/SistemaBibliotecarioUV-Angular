import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Recursos } from './pages/recursos/recursos';
import { Catalogos } from './pages/catalogos/catalogos';
import Cotizaciones from './pages/cotizaciones/cotizaciones';
import { Donaciones } from './pages/donaciones/donaciones';
import { Bajas } from './pages/bajas/bajas';
import { Descartes } from './pages/descartes/descartes';

import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'recursos',
        component: Recursos
      },
      {
        path: 'catalogos',
        component: Catalogos
      },
      {
        path: 'cotizaciones',
        component: Cotizaciones
      },
      {
        path: 'donaciones',
        component: Donaciones
      },
      {
        path: 'bajas',
        component: Bajas
      },
      {
        path: 'descartes',
        component: Descartes
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios').then(m => m.Usuarios),
        canActivate: [() => {
          const auth = inject(AuthService);
          const router = inject(Router);
          return auth.getUsuario()?.rol === 'RESPONSABLE_BIBLIOTECA'
            ? true : router.createUrlTree(['/dashboard']);
        }]
      },
      {
        path: 'servicio-practicas',
        loadComponent: () =>
          import('./pages/servicio-practicas/servicio-practicas')
            .then(m => m.ServicioPracticas)
      },
      {
        path: 'servicio-practicas/servicio-social',
        loadComponent: () =>
          import('./pages/servicio-social/servicio-social')
            .then(m => m.ServicioSocial)
      },
      {
        path: 'servicio-practicas/servicio-social/asistencia/:idAlumno',
        loadComponent: () =>
          import('./pages/control-asistencia/control-asistencia')
            .then(m => m.ControlAsistencia)
      },
      {
        path: 'servicio-practicas/practicas-profesionales',
        loadComponent: () =>
          import('./pages/practicas-profesionales/practicas-profesionales')
            .then(m => m.PracticasProfesionales)
      },
      {
        path: 'servicio-practicas/practicas-profesionales/asistencia/:idAlumno',
        loadComponent: () =>
          import('./pages/control-asistencia/control-asistencia')
            .then(m => m.ControlAsistencia)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
