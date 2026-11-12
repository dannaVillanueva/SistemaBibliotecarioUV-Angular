export interface Baja {
  idBaja: number;
  fechaBaja: string;
  motivo: string;
  observaciones: string | null;
  cantidad: number;

  idRecursoDocumental: number;
  tituloRecurso: string;
  isbn: string | null;

  idUsuario: number;
  nombreUsuario: string;
}

export interface BajaRequest {
  fechaBaja: string;
  motivo: string;
  observaciones: string;
  cantidad: number;
  idRecursoDocumental: number | null;
}

export interface RecursoParaBaja {
  idRecursoDocumental: number;
  titulo: string;
  autor?: string | null;
  isbn?: string | null;
  cantidad: number;
}
