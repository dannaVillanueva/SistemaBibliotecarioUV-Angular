import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  correo: string = '';
  password: string = '';
  cargando: boolean = false;
  mensajeError: string = '';
  mostrarPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  iniciarSesion(): void {
    this.mensajeError = '';

    if (!this.correo.trim() || !this.password.trim()) {
      this.mensajeError = 'Ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;

    this.authService.login({
      correo: this.correo.trim(),
      password: this.password
    }).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error al iniciar sesión:', error);
        this.cargando = false;

        if (error.status === 401 || error.status === 403) {
          this.mensajeError = 'Correo o contraseña incorrectos.';
        } else if (error.status === 0) {
          this.mensajeError = 'No fue posible conectar con el servidor.';
        } else {
          this.mensajeError = 'Ocurrió un error al iniciar sesión.';
        }
      }
    });
  }

  cambiarVisibilidadPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}
