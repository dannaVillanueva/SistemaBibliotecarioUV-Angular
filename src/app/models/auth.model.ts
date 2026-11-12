export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: string;
  mensaje: string;
  token: string;
}
