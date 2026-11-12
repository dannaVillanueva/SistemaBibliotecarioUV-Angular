import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Descarte,
  DescarteRequest,
  DescarteResolucion,
  RecursoParaDescarte
} from '../../models/descarte.model';

@Injectable({
  providedIn: 'root'
})
export class DescartesService {

  private readonly api = '/api/descartes';
  private readonly apiRecursos = '/api/recursos';

  constructor(private http: HttpClient) {}

  listar(): Observable<Descarte[]> {
    return this.http.get<Descarte[]>(this.api);
  }

  pendientes(): Observable<Descarte[]> {
    return this.http.get<Descarte[]>(
      `${this.api}/pendientes`
    );
  }

  buscarPorId(id: number): Observable<Descarte> {
    return this.http.get<Descarte>(
      `${this.api}/${id}`
    );
  }

  buscarPorRecurso(id: number): Observable<Descarte[]> {
    return this.http.get<Descarte[]>(
      `${this.api}/recurso/${id}`
    );
  }

  buscarPorUsuario(id: number): Observable<Descarte[]> {
    return this.http.get<Descarte[]>(
      `${this.api}/usuario/${id}`
    );
  }

  registrar(
    datos: DescarteRequest
  ): Observable<Descarte> {
    return this.http.post<Descarte>(
      this.api,
      datos
    );
  }

  aprobar(
    id: number,
    datos: DescarteResolucion
  ): Observable<Descarte> {
    return this.http.patch<Descarte>(
      `${this.api}/${id}/aprobar`,
      datos
    );
  }

  rechazar(
    id: number,
    datos: DescarteResolucion
  ): Observable<Descarte> {
    return this.http.patch<Descarte>(
      `${this.api}/${id}/rechazar`,
      datos
    );
  }

  listarRecursos(): Observable<RecursoParaDescarte[]> {
    return this.http.get<RecursoParaDescarte[]>(
      this.apiRecursos
    );
  }
}
