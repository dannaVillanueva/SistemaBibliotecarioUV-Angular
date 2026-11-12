import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  RegistroHoras,
  RegistroHorasRequest,
  ResumenHoras
} from '../../models/registro-horas.model';

@Injectable({
  providedIn: 'root'
})
export class RegistrosHorasService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/registros-horas';

  registrar(
    registro: RegistroHorasRequest
  ): Observable<RegistroHoras> {

    return this.http.post<RegistroHoras>(
      this.apiUrl,
      registro
    );
  }

  actualizar(
    id: number,
    registro: RegistroHorasRequest
  ): Observable<RegistroHoras> {

    return this.http.put<RegistroHoras>(
      `${this.apiUrl}/${id}`,
      registro
    );
  }

  historial(idAlumno: number): Observable<RegistroHoras[]> {
    return this.http.get<RegistroHoras[]>(
      `${this.apiUrl}/alumno/${idAlumno}`
    );
  }

  resumen(idAlumno: number): Observable<ResumenHoras> {
    return this.http.get<ResumenHoras>(
      `${this.apiUrl}/alumno/${idAlumno}/resumen`
    );
  }
}
