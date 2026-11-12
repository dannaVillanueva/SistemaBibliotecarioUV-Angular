export type TipoPractica =
  | 'SERVICIO_SOCIAL'
  | 'PRACTICAS_PROFESIONALES';

export interface AlumnoPractica {
  idAlumno: number;
  matricula: string;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  tipo: TipoPractica;
  fechaInicio: string;
  fechaFin: string;
  horasRequeridas: number;
  horasRealizadas: number;
  horasRestantes: number;
  porcentajeAvance: number;
  activo: boolean;
  estado: string;
  idProgramaEducativo: number;
  programaEducativo: string;
  programaEducativoCorto: string;
}

export interface AlumnoPracticaRequest {
  matricula: string;
  nombre: string;
  apellidos: string;
  correo: string;
  telefono: string;
  tipo: TipoPractica;
  fechaInicio: string;
  fechaFin: string;
  horasRequeridas: number;
  activo: boolean;
  programaEducativo: {
    idProgramaEducativo: number;
  };
}
