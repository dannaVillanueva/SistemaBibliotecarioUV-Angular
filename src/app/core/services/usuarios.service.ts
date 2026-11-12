import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type RolUsuario = 'RESPONSABLE_BIBLIOTECA' | 'PERSONAL_BIBLIOTECA';
export interface Usuario {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
}
export interface UsuarioFormulario {
  nombre: string;
  correo: string;
  password: string;
  rol: RolUsuario;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private url = '/api/usuarios';
  listar() { return this.http.get<Usuario[]>(this.url); }
  crear(datos: UsuarioFormulario) { return this.http.post<Usuario>(this.url, datos); }
  editar(id: number, datos: UsuarioFormulario) { return this.http.put<Usuario>(`${this.url}/${id}`, datos); }
  estado(id: number, activo: boolean) { return this.http.patch<Usuario>(`${this.url}/${id}/estado`, { activo }); }
}
