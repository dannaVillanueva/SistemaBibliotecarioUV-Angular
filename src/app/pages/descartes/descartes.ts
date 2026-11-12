import * as ExcelJS from 'exceljs';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import {
  Descarte,
  DescarteRequest,
  RecursoParaDescarte
} from '../../models/descarte.model';

import { DescartesService } from '../../core/services/descartes.service';

@Component({
  selector: 'app-descartes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './descartes.html',
  styleUrl: './descartes.scss'
})
export class Descartes implements OnInit {

  descartes: Descarte[] = [];
  recursos: RecursoParaDescarte[] = [];

  cargando = false;
  guardando = false;
  resolviendoId: number | null = null;
  mostrarFormulario = false;

  filtro = '';
  filtroEstado = 'TODOS';

  mensaje = '';
  error = '';

  form: DescarteRequest = this.nuevoFormulario();

  observacionesResolucion: Record<number, string> = {};

  constructor(
    private descartesService: DescartesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private fechaActual(): string {
    const fecha = new Date();

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1)
      .padStart(2, '0');
    const dia = String(fecha.getDate())
      .padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private nuevoFormulario(): DescarteRequest {
    return {
      fechaDescarte: this.fechaActual(),
      motivo: '',
      observaciones: '',
      cantidad: 1,
      idRecursoDocumental: null
    };
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    forkJoin({
      descartes: this.descartesService.listar(),
      recursos: this.descartesService.listarRecursos()
    }).subscribe({
      next: ({ descartes, recursos }) => {
        this.descartes = descartes;
        this.recursos = recursos;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.cargando = false;
        this.error = this.obtenerError(
          err,
          'No fue posible cargar los descartes.'
        );
        this.cdr.markForCheck();
      }
    });
  }

  get recursosDisponibles(): RecursoParaDescarte[] {
    return this.recursos.filter(
      recurso => Number(recurso.cantidad ?? 0) > 0
    );
  }

  get recursoSeleccionado(): RecursoParaDescarte | undefined {
    return this.recursos.find(
      recurso =>
        recurso.idRecursoDocumental ===
        Number(this.form.idRecursoDocumental)
    );
  }

  get disponibles(): number {
    return Number(
      this.recursoSeleccionado?.cantidad ?? 0
    );
  }

  get pendientes(): Descarte[] {
    return this.descartes
      .filter(d => d.estado === 'PENDIENTE')
      .sort((a, b) => b.idDescarte - a.idDescarte);
  }

  get aprobados(): number {
    return this.descartes.filter(
      d => d.estado === 'APROBADO'
    ).length;
  }

  get rechazados(): number {
    return this.descartes.filter(
      d => d.estado === 'RECHAZADO'
    ).length;
  }

  get ejemplaresRetirados(): number {
    return this.descartes
      .filter(d => d.estado === 'APROBADO')
      .reduce(
        (total, d) => total + Number(d.cantidad ?? 0),
        0
      );
  }

  get historialFiltrado(): Descarte[] {
    const texto = this.filtro.trim().toLowerCase();

    return this.descartes
      .filter(d => {
        if (
          this.filtroEstado !== 'TODOS' &&
          d.estado !== this.filtroEstado
        ) {
          return false;
        }

        if (!texto) {
          return true;
        }

        return [
          d.idDescarte,
          d.tituloRecurso,
          d.isbn,
          d.motivo,
          d.nombreUsuario,
          d.nombreUsuarioResolucion,
          d.estado
        ].some(
          campo => String(campo ?? '')
            .toLowerCase()
            .includes(texto)
        );
      })
      .sort((a, b) => b.idDescarte - a.idDescarte);
  }


  async exportarExcel(): Promise<void> {
    this.error = '';
    const registros = this.historialFiltrado;
    if (!registros.length) {
      this.error = 'No hay descartes para exportar con los filtros actuales.';
      this.cdr.markForCheck();
      return;
    }

    try {
      const libro = new ExcelJS.Workbook();
      libro.creator = 'Sistema Bibliotecario Interno FCA';
      libro.created = new Date();
      const hoja = libro.addWorksheet('Descartes', {
        views: [{ state: 'frozen', ySplit: 4 }]
      });

      hoja.columns = [
        { key: 'folio', width: 13 },
        { key: 'fecha', width: 17 },
        { key: 'recurso', width: 55 },
        { key: 'cantidad', width: 14 },
        { key: 'motivo', width: 38 },
        { key: 'estado', width: 18 },
        { key: 'solicitante', width: 30 },
        { key: 'resolucion', width: 58 },
        { key: 'baja', width: 13 }
      ];

      hoja.mergeCells('A1:I1');
      const titulo = hoja.getCell('A1');
      titulo.value = 'REPORTE DE DESCARTES';
      titulo.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } };
      titulo.alignment = { vertical: 'middle' };
      hoja.getRow(1).height = 30;

      hoja.mergeCells('A2:I2');
      const subtitulo = hoja.getCell('A2');
      subtitulo.value = 'Biblioteca Ing. Manuel Lima Flores · FCA';
      subtitulo.font = { italic: true, color: { argb: 'FF52677E' } };
      hoja.getRow(3).height = 10;

      const columnas = [
        'Folio', 'Fecha', 'Recurso', 'Cantidad', 'Motivo',
        'Estado', 'Solicitante', 'Resolución', 'Baja'
      ];
      const encabezado = hoja.getRow(4);
      encabezado.height = 27;
      columnas.forEach((nombre, indice) => {
        const celda = encabezado.getCell(indice + 1);
        celda.value = nombre;
        celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        celda.fill = {
          type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF315A86' }
        };
        celda.alignment = { vertical: 'middle', wrapText: true };
      });

      for (const d of registros) {
        // Los campos de resolución pueden variar según la versión del DTO.
        const detalle = d as unknown as Record<string, unknown>;
        const responsable = String(detalle['nombreUsuarioResolucion'] ?? '').trim();
        const fechaResolucion = String(detalle['fechaResolucion'] ?? '').trim();
        const observaciones = String(detalle['observacionesResolucion'] ?? '').trim();
        const resolucion = [
          responsable,
          fechaResolucion,
          observaciones
        ].filter(Boolean).join(' · ') || 'Sin resolución';
        const idBaja = detalle['idBaja'];

        const fila = hoja.addRow({
          folio: `#${d.idDescarte}`,
          fecha: detalle['fechaDescarte'] ?? '',
          recurso: d.tituloRecurso || 'Sin título',
          cantidad: Number(d.cantidad ?? 0),
          motivo: d.motivo ?? '',
          estado: d.estado ?? '',
          solicitante: d.nombreUsuario ?? '',
          resolucion,
          baja: idBaja == null || idBaja === '' ? '—' : `#${idBaja}`
        });

        fila.height = 35;
        for (let col = 1; col <= 9; col++) {
          const celda = fila.getCell(col);
          celda.alignment = { vertical: 'middle', wrapText: true };
          if (fila.number % 2 === 0) {
            celda.fill = {
              type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5FA' }
            };
          }
        }
      }

      hoja.autoFilter = { from: 'A4', to: `I${hoja.lastRow?.number ?? 4}` };
      const buffer = await libro.xlsx.writeBuffer();
      const archivo = new Blob([buffer as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `reporte_descartes_${this.fechaActual()}.xlsx`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Error al exportar descartes:', err);
      this.error = 'No se pudo generar el archivo Excel.';
    }
    this.cdr.markForCheck();
  }

  nuevaSolicitud(): void {
    this.form = this.nuevoFormulario();
    this.mensaje = '';
    this.error = '';
    this.mostrarFormulario = true;
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.error = '';
  }

  registrar(): void {
    this.error = '';
    this.mensaje = '';

    const cantidad = Number(this.form.cantidad);
    const id = this.form.idRecursoDocumental;

    if (id == null || !this.recursoSeleccionado) {
      this.error = 'Selecciona un recurso documental.';
      return;
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      this.error =
        'La cantidad debe ser un entero mayor que cero.';
      return;
    }

    if (cantidad > this.disponibles) {
      this.error =
        'La cantidad solicitada supera las existencias.';
      return;
    }

    if (!this.form.motivo.trim()) {
      this.error = 'Selecciona el motivo del descarte.';
      return;
    }

    if (!this.form.fechaDescarte) {
      this.error = 'Selecciona la fecha.';
      return;
    }

    const confirmado = confirm(
      `¿Registrar solicitud de descarte de ${cantidad} ` +
      `ejemplar(es) de "${this.recursoSeleccionado.titulo}"?\n\n` +
      'El inventario no cambiará hasta su aprobación.'
    );

    if (!confirmado) {
      return;
    }

    this.guardando = true;

    this.descartesService.registrar({
      ...this.form,
      cantidad,
      motivo: this.form.motivo.trim(),
      observaciones: this.form.observaciones.trim()
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.form = this.nuevoFormulario();
        this.mensaje =
          'Solicitud registrada correctamente. Estado: PENDIENTE.';
        this.cargarDatos();
      },
      error: err => {
        this.guardando = false;
        this.error = this.obtenerError(
          err,
          'No fue posible registrar la solicitud.'
        );
        this.cdr.markForCheck();
      }
    });
  }

  aprobar(descarte: Descarte): void {
    if (
      this.resolviendoId !== null ||
      descarte.estado !== 'PENDIENTE'
    ) {
      return;
    }

    const confirmado = confirm(
      `¿Aprobar el descarte #${descarte.idDescarte}?\n\n` +
      `Libro: ${descarte.tituloRecurso}\n` +
      `Cantidad: ${descarte.cantidad}\n\n` +
      'Se descontarán los ejemplares del inventario ' +
      'y se generará una baja definitiva.'
    );

    if (!confirmado) {
      return;
    }

    this.resolviendoId = descarte.idDescarte;
    this.error = '';
    this.mensaje = '';

    this.descartesService.aprobar(
      descarte.idDescarte,
      {
        observacionesResolucion:
          this.observacionesResolucion[
            descarte.idDescarte
            ] ?? ''
      }
    ).subscribe({
      next: resultado => {
        this.resolviendoId = null;
        this.mensaje =
          `Descarte #${resultado.idDescarte} aprobado. ` +
          `Baja generada: #${resultado.idBaja}.`;
        this.cargarDatos();
      },
      error: err => {
        this.resolviendoId = null;
        this.error = this.obtenerError(
          err,
          'No fue posible aprobar el descarte.'
        );
        this.cargarDatos();
        this.cdr.markForCheck();
      }
    });
  }

  rechazar(descarte: Descarte): void {
    if (
      this.resolviendoId !== null ||
      descarte.estado !== 'PENDIENTE'
    ) {
      return;
    }

    const observaciones = (
      this.observacionesResolucion[
        descarte.idDescarte
        ] ?? ''
    ).trim();

    if (!observaciones) {
      this.error =
        'Para rechazar, escribe el motivo de la resolución.';
      return;
    }

    const confirmado = confirm(
      `¿Rechazar la solicitud #${descarte.idDescarte}?\n\n` +
      'El inventario no será modificado.'
    );

    if (!confirmado) {
      return;
    }

    this.resolviendoId = descarte.idDescarte;
    this.error = '';
    this.mensaje = '';

    this.descartesService.rechazar(
      descarte.idDescarte,
      { observacionesResolucion: observaciones }
    ).subscribe({
      next: () => {
        this.resolviendoId = null;
        this.mensaje =
          `Solicitud #${descarte.idDescarte} rechazada.`;
        this.cargarDatos();
      },
      error: err => {
        this.resolviendoId = null;
        this.error = this.obtenerError(
          err,
          'No fue posible rechazar la solicitud.'
        );
        this.cargarDatos();
        this.cdr.markForCheck();
      }
    });
  }

  private obtenerError(
    err: any,
    predeterminado: string
  ): string {
    if (err?.status === 401) {
      return 'La sesión ha expirado. Inicia sesión nuevamente.';
    }

    if (err?.status === 403) {
      return 'No tienes permiso para realizar esta operación.';
    }

    if (err?.status === 409) {
      return 'La solicitud ya fue resuelta por otro usuario.';
    }

    return (
      err?.error?.detail ||
      err?.error?.message ||
      predeterminado
    );
  }
}
