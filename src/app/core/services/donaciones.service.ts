import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  Donacion,
  DonacionRequest,
  RecursoDonado
} from '../../models/donacion.model';

@Injectable({
  providedIn: 'root'
})
export class DonacionesService {

  private readonly api = '/api/donaciones';

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<Donacion[]>(this.api);
  }

  recursos() {
    return this.http.get<RecursoDonado[]>('/api/recursos');
  }

  crear(datos: DonacionRequest) {
    return this.http.post<Donacion>(
      this.api,
      datos
    );
  }

  actualizar(id: number, datos: DonacionRequest) {
    return this.http.put<Donacion>(
      `${this.api}/${id}`,
      datos
    );
  }

  eliminar(id: number) {
    return this.http.delete<void>(
      `${this.api}/${id}`
    );
  }
}
