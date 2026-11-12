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
  Baja,
  BajaRequest,
  RecursoParaBaja
} from '../../models/baja.model';

import { BajasService } from '../../core/services/bajas.service';

@Component({
  selector: 'app-bajas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bajas.html',
  styleUrl: './bajas.scss'
})
export class Bajas implements OnInit {

  bajas: Baja[] = [];
  recursos: RecursoParaBaja[] = [];

  cargando = false;
  guardando = false;
  mostrarFormulario = false;

  filtro = '';
  mensaje = '';
  error = '';

  form: BajaRequest = this.nuevoFormulario();

  constructor(
    private bajasService: BajasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private fechaActual(): string {
    const fecha = new Date();

    const anio = fecha.getFullYear();
    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private nuevoFormulario(): BajaRequest {
    return {
      fechaBaja: this.fechaActual(),
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
      bajas: this.bajasService.listar(),
      recursos: this.bajasService.listarRecursos()
    }).subscribe({
      next: ({ bajas, recursos }) => {
        this.bajas = bajas;
        this.recursos = recursos;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.cargando = false;
        this.error = this.obtenerError(
          err,
          'No se pudieron cargar los datos de bajas.'
        );
        this.cdr.markForCheck();
      }
    });
  }

  get recursosDisponibles(): RecursoParaBaja[] {
    return this.recursos.filter(
      recurso => Number(recurso.cantidad ?? 0) > 0
    );
  }

  get recursoSeleccionado(): RecursoParaBaja | undefined {
    return this.recursos.find(
      recurso =>
        recurso.idRecursoDocumental ===
        Number(this.form.idRecursoDocumental)
    );
  }

  get existenciasDisponibles(): number {
    return Number(
      this.recursoSeleccionado?.cantidad ?? 0
    );
  }

  get bajasFiltradas(): Baja[] {
    const busqueda = this.filtro
      .trim()
      .toLowerCase();

    return this.bajas
      .filter(baja => {
        if (!busqueda) {
          return true;
        }

        const campos = [
          baja.idBaja,
          baja.fechaBaja,
          baja.motivo,
          baja.tituloRecurso,
          baja.isbn,
          baja.nombreUsuario,
          baja.observaciones
        ];

        return campos.some(
          campo =>
            String(campo ?? '')
              .toLowerCase()
              .includes(busqueda)
        );
      })
      .sort(
        (a, b) => b.idBaja - a.idBaja
      );
  }

  get totalEjemplaresDadosDeBaja(): number {
    return this.bajas.reduce(
      (total, baja) =>
        total + Number(baja.cantidad ?? 0),
      0
    );
  }

  get recursosAfectados(): number {
    return new Set(
      this.bajas.map(
        baja => baja.idRecursoDocumental
      )
    ).size;
  }

  async exportarExcel(): Promise<void> {
    this.error = '';
    const registros = this.bajasFiltradas;
    if (!registros.length) {
      this.error = 'No hay bajas para exportar con el filtro actual.';
      this.cdr.markForCheck();
      return;
    }

    try {
      const libro = new ExcelJS.Workbook();
      libro.creator = 'Sistema Bibliotecario Interno FCA';
      libro.created = new Date();
      const hoja = libro.addWorksheet('Bajas', {
        views: [{ state: 'frozen', ySplit: 4 }]
      });

      hoja.columns = [
        { key: 'folio', width: 13 },
        { key: 'fecha', width: 17 },
        { key: 'recurso', width: 55 },
        { key: 'cantidad', width: 15 },
        { key: 'motivo', width: 42 },
        { key: 'responsable', width: 30 },
        { key: 'observaciones', width: 65 }
      ];

      hoja.mergeCells('A1:G1');
      const titulo = hoja.getCell('A1');
      titulo.value = 'REPORTE DE BAJAS DE RECURSOS DOCUMENTALES';
      titulo.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      titulo.alignment = { vertical: 'middle' };
      titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } };
      hoja.getRow(1).height = 30;

      hoja.mergeCells('A2:G2');
      hoja.getCell('A2').value = 'Biblioteca Ing. Manuel Lima Flores · FCA';
      hoja.getCell('A2').font = { italic: true, color: { argb: 'FF52677E' } };
      hoja.addRow([]);

      const encabezado = hoja.getRow(4);
      encabezado.values = [
        'Folio', 'Fecha', 'Recurso documental', 'Cantidad',
        'Motivo', 'Responsable', 'Observaciones'
      ];
      encabezado.height = 25;
      for (let columna = 1; columna <= 7; columna++) {
        const celda = encabezado.getCell(columna);
        celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF315A86' } };
        celda.alignment = { vertical: 'middle', wrapText: true };
      }

      for (const baja of registros) {
        const fila = hoja.addRow({
          folio: `#${baja.idBaja}`,
          fecha: baja.fechaBaja || '',
          recurso: baja.tituloRecurso || 'Sin título',
          cantidad: Number(baja.cantidad ?? 0),
          motivo: baja.motivo || '',
          responsable: baja.nombreUsuario || '',
          observaciones: baja.observaciones || ''
        });
        for (let columna = 1; columna <= 7; columna++) {
          const celda = fila.getCell(columna);
          celda.alignment = { vertical: 'middle', wrapText: true };
          if (fila.number % 2 === 0) {
            celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5FA' } };
          }
        }
      }

      hoja.autoFilter = { from: 'A4', to: `G${hoja.lastRow?.number ?? 4}` };
      const buffer = await libro.xlsx.writeBuffer();
      const archivo = new Blob([buffer as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `reporte_bajas_${this.fechaActual()}.xlsx`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Error al exportar bajas:', err);
      this.error = 'No se pudo generar el reporte Excel de bajas.';
    }
    this.cdr.markForCheck();
  }

  nuevaBaja(): void {
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

    const idRecurso =
      this.form.idRecursoDocumental;

    const cantidad =
      Number(this.form.cantidad);

    if (idRecurso == null) {
      this.error =
        'Debes seleccionar un recurso documental.';
      return;
    }

    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      this.error =
        'La cantidad debe ser un número entero mayor que cero.';
      return;
    }

    if (!this.form.motivo.trim()) {
      this.error =
        'Debes indicar el motivo de la baja.';
      return;
    }

    if (!this.form.fechaBaja) {
      this.error =
        'Debes indicar la fecha de la baja.';
      return;
    }

    if (cantidad > this.existenciasDisponibles) {
      this.error =
        'No puedes dar de baja más ejemplares de los disponibles.';
      return;
    }

    const recurso = this.recursoSeleccionado;

    if (!recurso) {
      this.error =
        'No se encontró el recurso seleccionado.';
      return;
    }

    const confirmado = confirm(
      `¿Confirmas la baja definitiva de ` +
      `${cantidad} ejemplar(es) de "${recurso.titulo}"?\n\n` +
      `Esta operación quedará registrada en el historial.`
    );

    if (!confirmado) {
      return;
    }

    const datos: BajaRequest = {
      fechaBaja: this.form.fechaBaja,
      motivo: this.form.motivo.trim(),
      observaciones:
        this.form.observaciones.trim(),
      cantidad,
      idRecursoDocumental: idRecurso
    };

    this.guardando = true;

    this.bajasService.registrar(datos).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.form = this.nuevoFormulario();

        this.mensaje =
          'Baja registrada correctamente. ' +
          'El inventario ha sido actualizado.';

        this.cargarDatos();
      },
      error: err => {
        this.guardando = false;
        this.error = this.obtenerError(
          err,
          'No fue posible registrar la baja.'
        );
        this.cdr.markForCheck();
      }
    });
  }

  private obtenerError(
    err: any,
    mensajePredeterminado: string
  ): string {
    if (err?.status === 401) {
      return 'Tu sesión no es válida o ha expirado.';
    }

    if (err?.status === 403) {
      return 'No tienes permiso para registrar o consultar bajas.';
    }

    return (
      err?.error?.detail ||
      err?.error?.message ||
      mensajePredeterminado
    );
  }
}
