import { TipoPractica } from './alumno-practica.model';

export interface RegistroHoras {
  idRegistro: number;
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  horasRealizadas: number;
  observaciones: string;
  idAlumno: number;
  nombreAlumno: string;
  matricula: string;
  idUsuario: number;
  nombreUsuario: string;
}

export interface RegistroHorasRequest {
  idAlumno: number;
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  observaciones: string;
}

export interface ResumenHoras {
  idAlumno: number;
  nombreCompleto: string;
  matricula: string;
  tipo: TipoPractica;
  horasHoy: number;
  horasSemana: number;
  horasMes: number;
  horasRequeridas: number;
  horasRealizadas: number;
  horasRestantes: number;
  porcentajeAvance: number;
}
