import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ProgramaEducativo } from '../../models/programa-educativo.model';

@Injectable({
  providedIn: 'root'
})
export class ProgramasEducativosService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/programas';

  listar(): Observable<ProgramaEducativo[]> {
    return this.http.get<ProgramaEducativo[]>(
      this.apiUrl
    );
  }

  buscarPorId(
    id: number
  ): Observable<ProgramaEducativo> {
    return this.http.get<ProgramaEducativo>(
      `${this.apiUrl}/${id}`
    );
  }
}
