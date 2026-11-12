import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cotizacion, DetalleCotizacion } from '../../models/cotizacion.model';

export interface HistorialCotizacion {
  idHistorial: number;
  idCotizacion: number;
  fechaHora: string;
  accion: string;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  usuario: string | null;
  observaciones: string | null;
  datosAnteriores: string | null;
  datosNuevos: string | null;
}

export interface CotizacionCompletaRequest {
  cotizacion: Cotizacion;
  detalles: DetalleCotizacion[];
}

@Injectable({ providedIn: 'root' })
export class CotizacionesService {
  private readonly url = '/api/cotizaciones';
  private readonly detallesUrl = '/api/detalles-cotizacion';

  constructor(private http: HttpClient) {}

  listarHistorial(): Observable<HistorialCotizacion[]> {
    return this.http.get<HistorialCotizacion[]>(`${this.url}/historial`);
  }

  listarHistorialPorCotizacion(id: number): Observable<HistorialCotizacion[]> {
    return this.http.get<HistorialCotizacion[]>(`${this.url}/${id}/historial`);
  }

  actualizarCompleta(id: number, solicitud: CotizacionCompletaRequest): Observable<Cotizacion> {
    return this.http.put<Cotizacion>(`${this.url}/${id}/completa`, solicitud);
  }

  listar(): Observable<Cotizacion[]> {
    return this.http.get<Cotizacion[]>(this.url);
  }

  buscarPorId(id: number): Observable<Cotizacion> {
    return this.http.get<Cotizacion>(`${this.url}/${id}`);
  }

  guardar(cotizacion: Cotizacion): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(this.url, cotizacion);
  }

  guardarCompleta(solicitud: CotizacionCompletaRequest): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.url}/completa`, solicitud);
  }

  actualizar(id: number, cotizacion: Cotizacion): Observable<Cotizacion> {
    return this.http.put<Cotizacion>(`${this.url}/${id}`, cotizacion);
  }

  cambiarEstado(id: number, estado: 'aprobada' | 'rechazada'): Observable<Cotizacion> {
    return this.http.patch<Cotizacion>(`${this.url}/${id}/estado`, { estado });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  listarDetalles(): Observable<DetalleCotizacion[]> {
    return this.http.get<DetalleCotizacion[]>(this.detallesUrl);
  }

  listarDetallesPorCotizacion(idCotizacion: number): Observable<DetalleCotizacion[]> {
    return this.http.get<DetalleCotizacion[]>(`${this.url}/${idCotizacion}/detalles`);
  }

  guardarDetalle(detalle: DetalleCotizacion): Observable<DetalleCotizacion> {
    return this.http.post<DetalleCotizacion>(this.detallesUrl, detalle);
  }

  actualizarDetalle(id: number, detalle: DetalleCotizacion): Observable<DetalleCotizacion> {
    return this.http.put<DetalleCotizacion>(`${this.detallesUrl}/${id}`, detalle);
  }

  eliminarDetalle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.detallesUrl}/${id}`);
  }
}
