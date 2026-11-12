import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Baja,
  BajaRequest,
  RecursoParaBaja
} from '../../models/baja.model';

@Injectable({
  providedIn: 'root'
})
export class BajasService {

  private readonly api = '/api/bajas';
  private readonly apiRecursos = '/api/recursos';

  constructor(private http: HttpClient) {}

  listar(): Observable<Baja[]> {
    return this.http.get<Baja[]>(this.api);
  }

  buscarPorId(id: number): Observable<Baja> {
    return this.http.get<Baja>(
      `${this.api}/${id}`
    );
  }

  buscarPorRecurso(id: number): Observable<Baja[]> {
    return this.http.get<Baja[]>(
      `${this.api}/recurso/${id}`
    );
  }

  registrar(datos: BajaRequest): Observable<Baja> {
    return this.http.post<Baja>(
      this.api,
      datos
    );
  }

  listarRecursos(): Observable<RecursoParaBaja[]> {
    return this.http.get<RecursoParaBaja[]>(
      this.apiRecursos
    );
  }
}
