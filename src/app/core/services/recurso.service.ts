import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecursoDocumental, RecursoFiltros, RecursoRegistroRequestDTO } from '../../models/recurso.model';

@Injectable({ providedIn: 'root' })
export class RecursoService {
  private readonly url = '/api/recursos';
  constructor(private http: HttpClient) {}

  listar(): Observable<RecursoDocumental[]> {
    return this.http.get<RecursoDocumental[]>(this.url);
  }

  buscarPorId(id: number): Observable<RecursoDocumental> {
    return this.http.get<RecursoDocumental>(`${this.url}/${id}`);
  }

  buscar(filtros: RecursoFiltros): Observable<RecursoDocumental[]> {
    let params = new HttpParams();
    const valores: Record<string, string | number | boolean | null | undefined> = {
      titulo: filtros.titulo, autor: filtros.autor, isbn: filtros.isbn,
      tipo: filtros.tipo, anio: filtros.anio, idEditorial: filtros.idEditorial,
      enCatalogo: filtros.enCatalogoBiblioFca,
      idExperienciaEducativa: filtros.idExperienciaEducativa,
      idAcademia: filtros.idAcademia, idProgramaEducativo: filtros.idProgramaEducativo
    };
    for (const [clave, valor] of Object.entries(valores)) {
      if (valor !== null && valor !== undefined && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return this.http.get<RecursoDocumental[]>(`${this.url}/buscar`, { params });
  }

  guardar(recurso: RecursoDocumental): Observable<RecursoDocumental> {
    return this.http.post<RecursoDocumental>(this.url, recurso);
  }

  registrarConVinculaciones(recurso: RecursoRegistroRequestDTO): Observable<RecursoDocumental> {
    return this.http.post<RecursoDocumental>(`${this.url}/registro`, recurso);
  }

  actualizarCompleto(id: number, recurso: RecursoRegistroRequestDTO): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}/edicion`, recurso);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  actualizar(id: number, recurso: RecursoDocumental): Observable<RecursoDocumental> {
    return this.http.put<RecursoDocumental>(`${this.url}/${id}`, recurso);
  }
}
