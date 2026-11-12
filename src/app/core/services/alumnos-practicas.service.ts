import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AlumnoPractica,
  AlumnoPracticaRequest,
  TipoPractica
} from '../../models/alumno-practica.model';

@Injectable({
  providedIn: 'root'
})
export class AlumnosPracticasService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/alumnos-practicas';

  listar(): Observable<AlumnoPractica[]> {
    return this.http.get<AlumnoPractica[]>(this.apiUrl);
  }

  buscarPorTipo(
    tipo: TipoPractica
  ): Observable<AlumnoPractica[]> {

    const params = new HttpParams().set('tipo', tipo);

    return this.http.get<AlumnoPractica[]>(
      `${this.apiUrl}/buscar`,
      { params }
    );
  }

  buscarPorId(id: number): Observable<AlumnoPractica> {
    return this.http.get<AlumnoPractica>(
      `${this.apiUrl}/${id}`
    );
  }

  guardar(
    alumno: AlumnoPracticaRequest
  ): Observable<AlumnoPractica> {

    return this.http.post<AlumnoPractica>(
      this.apiUrl,
      alumno
    );
  }

  actualizar(
    id: number,
    alumno: AlumnoPracticaRequest
  ): Observable<AlumnoPractica> {

    return this.http.put<AlumnoPractica>(
      `${this.apiUrl}/${id}`,
      alumno
    );
  }

  cambiarEstado(
    id: number,
    activo: boolean
  ): Observable<AlumnoPractica> {

    const params = new HttpParams().set(
      'activo',
      String(activo)
    );

    return this.http.patch<AlumnoPractica>(
      `${this.apiUrl}/${id}/estado`,
      {},
      { params }
    );
  }

  finalizar(id: number): Observable<AlumnoPractica> {
    return this.http.patch<AlumnoPractica>(
      `${this.apiUrl}/${id}/finalizar`,
      {}
    );
  }

  reactivar(id: number): Observable<AlumnoPractica> {
    return this.http.patch<AlumnoPractica>(
      `${this.apiUrl}/${id}/reactivar`,
      {}
    );
  }
}
