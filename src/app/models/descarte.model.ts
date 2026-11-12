export type EstadoDescarte =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'RECHAZADO';

export interface Descarte {
  idDescarte: number;
  fechaDescarte: string;
  motivo: string;
  observaciones: string | null;
  cantidad: number;
  estado: EstadoDescarte;

  fechaResolucion: string | null;
  observacionesResolucion: string | null;

  idRecursoDocumental: number;
  tituloRecurso: string;
  isbn: string | null;

  idUsuario: number;
  nombreUsuario: string;

  idUsuarioResolucion: number | null;
  nombreUsuarioResolucion: string | null;

  idBaja: number | null;
}

export interface DescarteRequest {
  fechaDescarte: string;
  motivo: string;
  observaciones: string;
  cantidad: number;
  idRecursoDocumental: number | null;
}

export interface DescarteResolucion {
  observacionesResolucion: string;
}

export interface RecursoParaDescarte {
  idRecursoDocumental: number;
  titulo: string;
  autor?: string | null;
  isbn?: string | null;
  cantidad: number;
}
