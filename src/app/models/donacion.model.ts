export interface RecursoDonado {
  idRecursoDocumental: number;
  titulo: string;
  autor?: string | null;
  isbn?: string | null;
  cantidad?: number | null;
}

export interface Donacion {
  idDonacion: number;
  nombreDonante: string;
  fechaDonacion: string;
  cantidad: number;
  precioEstimado: number | null;
  observaciones: string | null;
  recursoDocumental: RecursoDonado;
}

export interface LibroNuevo {
  titulo: string;
  autor: string;
  isbn: string;
  edicion: string;
  anio: string;
  tipo: string;
}

export interface DonacionRequest {
  nombreDonante: string;
  fechaDonacion: string;
  cantidad: number;
  precioEstimado: number | null;
  observaciones: string;
  idRecursoDocumental: number | null;
  libroNuevo: LibroNuevo | null;
}
