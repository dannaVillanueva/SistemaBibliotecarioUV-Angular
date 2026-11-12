import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {

  usuario: ReturnType<AuthService['getUsuario']>;

  menuAbierto = true;
  catalogosAbiertos = false;

  constructor(
    private authService: AuthService,
    public router: Router
  ) {
    this.usuario = this.authService.getUsuario();

    this.catalogosAbiertos =
      this.router.url.startsWith('/catalogos');
  }

  cambiarMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cambiarCatalogos(): void {

    if (!this.menuAbierto) {
      this.menuAbierto = true;
      this.catalogosAbiertos = true;
      return;
    }

    this.catalogosAbiertos =
      !this.catalogosAbiertos;
  }

  catalogosActivo(): boolean {
    return this.router.url.startsWith('/catalogos');
  }

  cerrarSesion(): void {

    this.authService.logout();

    void this.router.navigate(['/login']);
  }
}
