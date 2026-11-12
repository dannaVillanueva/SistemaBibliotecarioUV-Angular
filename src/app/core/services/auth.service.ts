import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  LoginRequest,
  LoginResponse
} from '../../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly API_URL = '/api/auth';

  private readonly TOKEN_KEY = 'biblioteca_token';
  private readonly USER_KEY = 'biblioteca_usuario';

  constructor(
    private http: HttpClient
  ) {
  }

  login(datos: LoginRequest): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        `${this.API_URL}/login`,
        datos
      )
      .pipe(
        tap(respuesta => {

          localStorage.setItem(
            this.TOKEN_KEY,
            respuesta.token
          );

          localStorage.setItem(
            this.USER_KEY,
            JSON.stringify({
              idUsuario: respuesta.idUsuario,
              nombre: respuesta.nombre,
              correo: respuesta.correo,
              rol: respuesta.rol
            })
          );

        })
      );
  }

  logout(): void {

    localStorage.removeItem(
      this.TOKEN_KEY
    );

    localStorage.removeItem(
      this.USER_KEY
    );
  }

  getToken(): string | null {

    return localStorage.getItem(
      this.TOKEN_KEY
    );
  }

  getUsuario(): any | null {

    const usuario =
      localStorage.getItem(
        this.USER_KEY
      );

    if (!usuario) {
      return null;
    }

    try {

      return JSON.parse(usuario);

    } catch {

      return null;
    }
  }

  isLoggedIn(): boolean {

    const token = this.getToken();

    return token !== null &&
      token.trim() !== '';
  }
}
