import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProgramaCatalogo {
  idProgramaEducativo: number;
  nombre: string;
  nombreCorto: string | null;
  anio: string | null;
  modalidad: string | null;
}

export interface AcademiaCatalogo {
  idAcademia: number;
  nombre: string;
  programasEducativos: ProgramaCatalogo[];
}

export interface ExperienciaCatalogo {
  idExperienciaEducativa: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  academias: AcademiaCatalogo[];
}

export interface EditorialCatalogo {
  idEditorial: number;
  nombre: string;
  paginaWeb: string | null;
}

export type SeccionCatalogo = 'programas' | 'academias' | 'experiencias' | 'editoriales';
export type RegistroCatalogo = ProgramaCatalogo | AcademiaCatalogo | ExperienciaCatalogo | EditorialCatalogo;

@Injectable({ providedIn: 'root' })
export class AdministracionCatalogosService {
  private readonly http = inject(HttpClient);
  private readonly rutas: Record<SeccionCatalogo, string> = {
    programas: '/api/programas',
    academias: '/api/academias',
    experiencias: '/api/experiencias',
    editoriales: '/api/editoriales'
  };

  listar<T extends RegistroCatalogo>(seccion: SeccionCatalogo): Observable<T[]> {
    return this.http.get<T[]>(this.rutas[seccion]);
  }

  crear<T extends RegistroCatalogo>(seccion: SeccionCatalogo, datos: object): Observable<T> {
    return this.http.post<T>(this.rutas[seccion], datos);
  }

  actualizar<T extends RegistroCatalogo>(seccion: SeccionCatalogo, id: number, datos: object): Observable<T> {
    return this.http.put<T>(`${this.rutas[seccion]}/${id}`, datos);
  }

  eliminar(seccion: SeccionCatalogo, id: number): Observable<void> {
    return this.http.delete<void>(`${this.rutas[seccion]}/${id}`);
  }
}
