import {
  Academia,
  ProgramaEducativo,
  RecursoDocumental
} from './recurso.model';

// ========================================
// COTIZACIÓN
// ========================================

export interface Cotizacion {
  idCotizacion?: number;
  fechaSolicitud: string;
  estado: string;
  observaciones: string | null;

  // Datos del docente solicitante
  solicitante?: string | null;
  correoSolicitante?: string | null;
  telefonoSolicitante?: string | null;
  dependencia?: string | null;
  justificacion?: string | null;
  proveedorSugerido?: string | null;
}

// ========================================
// DETALLE DE COTIZACIÓN
// ========================================

export interface DetalleCotizacion {
  idDetalleCotizacion?: number;

  cantidad: number;
  precioUnitarioEstimado: number;
  subtotal?: number;
  filu: string;

  cotizacion: Cotizacion;

  // Puede ser null cuando se cotiza un libro externo.
  recursoDocumental: RecursoDocumental | null;

  programaEducativo: ProgramaEducativo | null;
  academia: Academia | null;

  // Datos de un libro externo
  tituloExterno?: string | null;
  autorExterno?: string | null;
  isbnExterno?: string | null;
  editorialExterna?: string | null;
  editorial?: { idEditorial: number; nombre?: string } | null;
  urlCotizacion?: string | null;
  estadoAdquisicion?: string | null;
  edicionExterna?: string | null;
  anioExterno?: number | null;
}

// ========================================
// FORMULARIO DE DETALLE
// ========================================

export interface DetalleFormulario {
  idDetalleCotizacion?: number;

  // Tipo de recurso
  origen?: 'catalogo' | 'externo';

  // Recurso registrado en biblioteca
  idRecursoDocumental: number | null;

  // Datos de libro externo
  tituloExterno?: string;
  autorExterno?: string;
  isbnExterno?: string;
  editorialExterna?: string;
  idEditorial?: number | null;
  urlCotizacion?: string;
  estadoAdquisicion?: string;
  edicionExterna?: string;
  anioExterno?: number | null;

  // Relación académica
  idProgramaEducativo: number | null;
  idAcademia: number | null;

  // Datos de cotización
  cantidad: number;
  precioUnitarioEstimado: number;
  filu: string;
}
