export interface ProgramaEducativo { idProgramaEducativo: number; nombre: string; nombreCorto: string; anio: string; }
export interface Academia { idAcademia: number; nombre: string; programasEducativos: ProgramaEducativo[]; }
export interface ExperienciaEducativa { idExperienciaEducativa: number; nombre: string; descripcion: string | null; estado: boolean; academias: Academia[]; }
export interface Editorial { idEditorial: number; nombre: string; paginaWeb?: string | null; }
export interface VinculacionAcademica { idVinculacion?: number; programaEducativo: ProgramaEducativo; academia: Academia; experienciaEducativa: ExperienciaEducativa; }
export interface VinculacionAcademicaRequestDTO { idProgramaEducativo: number; idAcademia: number; idExperienciaEducativa: number; }
export interface RecursoDocumental {
  idRecursoDocumental?: number; titulo: string; autor: string | null; edicion: string | null; anio: string | null;
  formato: 'FISICO' | 'ELECTRONICO' | null; urlRecurso: string | null;
  isbn: string | null; cantidad: number; movimiento: string | null; enCatalogoBiblioFca: boolean;
  observaciones: string | null; tipo: string | null; editorial?: Editorial | null;
  experienciasEducativas?: ExperienciaEducativa[]; vinculacionesAcademicas?: VinculacionAcademica[];
}
export interface RecursoRegistroRequestDTO {
  titulo: string; autor: string | null; edicion: string | null; anio: string | null;
  formato: 'FISICO' | 'ELECTRONICO' | null; urlRecurso: string | null;
  isbn: string | null; cantidad: number; movimiento: string | null; enCatalogoBiblioFca: boolean;
  observaciones: string | null; tipo: string; idEditorial: number | null; nuevaEditorial: string | null;
  vinculacionesAcademicas: VinculacionAcademicaRequestDTO[];
}
export interface RecursoFiltros {
  titulo?: string; autor?: string; isbn?: string; tipo?: string; anio?: string;
  idEditorial?: number | null; enCatalogoBiblioFca?: boolean | null;
  idExperienciaEducativa?: number | null; idAcademia?: number | null; idProgramaEducativo?: number | null;
}
