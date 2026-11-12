import * as ExcelJS from 'exceljs';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Donacion, DonacionRequest, LibroNuevo, RecursoDonado } from '../../models/donacion.model';
import { DonacionesService } from '../../core/services/donaciones.service';

@Component({
  selector: 'app-donaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './donaciones.html',
  styleUrl: './donaciones.scss'
})
export class Donaciones implements OnInit {
  donaciones: Donacion[] = [];
  recursos: RecursoDonado[] = [];
  cargando = false;
  guardando = false;
  mostrarFormulario = false;
  editandoId: number | null = null;
  modo: 'existente' | 'nuevo' = 'existente';
  filtro = '';
  mensaje = '';
  error = '';
  form: DonacionRequest = this.nuevoFormulario();

  constructor(private api: DonacionesService, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.cargar(); }

  private fechaHoy(): string {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  private libroVacio(): LibroNuevo {
    return { titulo: '', autor: '', isbn: '', edicion: '', anio: '', tipo: 'Libro' };
  }
  private nuevoFormulario(): DonacionRequest {
    return { nombreDonante: '', fechaDonacion: this.fechaHoy(), cantidad: 1,
      precioEstimado: null, observaciones: '', idRecursoDocumental: null, libroNuevo: null };
  }
  cargar(): void {
    this.cargando = true;
    forkJoin({ donaciones: this.api.listar(), recursos: this.api.recursos() }).subscribe({
      next: ({ donaciones, recursos }) => {
        this.donaciones = donaciones;
        this.recursos = recursos;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.error = this.errorHttp(err, 'No se pudieron cargar las donaciones.');
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }
  get filtradas(): Donacion[] {
    const q = this.filtro.trim().toLowerCase();
    return this.donaciones.filter(d =>
      !q || [d.idDonacion, d.nombreDonante, d.fechaDonacion,
        d.recursoDocumental?.titulo, d.recursoDocumental?.isbn]
        .some(x => String(x ?? '').toLowerCase().includes(q))
    ).sort((a,b) => b.idDonacion - a.idDonacion);
  }
  get totalEjemplares(): number {
    return this.donaciones.reduce((a,d) => a + Number(d.cantidad ?? 0), 0);
  }
  get valorTotal(): number {
    return this.donaciones.reduce((a,d) => a + Number(d.precioEstimado ?? 0), 0);
  }
  async exportarExcel(): Promise<void> {
    this.error = '';
    const registros = this.filtradas;
    if (!registros.length) {
      this.error = 'No hay donaciones para exportar con el filtro actual.';
      return;
    }
    try {
      const libro = new ExcelJS.Workbook();
      libro.creator = 'Sistema Bibliotecario Interno FCA';
      libro.created = new Date();
      const hoja = libro.addWorksheet('Donaciones', {
        views: [{ state: 'frozen', ySplit: 4 }]
      });
      hoja.columns = [
        { key: 'folio', width: 13 },
        { key: 'fecha', width: 17 },
        { key: 'donante', width: 32 },
        { key: 'libro', width: 56 },
        { key: 'cantidad', width: 15 },
        { key: 'valor', width: 22 }
      ];
      hoja.mergeCells('A1:F1');
      hoja.getCell('A1').value = 'REPORTE DE DONACIONES';
      hoja.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      hoja.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } };
      hoja.getRow(1).height = 30;
      hoja.mergeCells('A2:F2');
      hoja.getCell('A2').value = 'Biblioteca Ing. Manuel Lima Flores · FCA';
      hoja.getCell('A2').font = { italic: true, color: { argb: 'FF52677E' } };
      hoja.addRow([]);
      const encabezado = hoja.getRow(4);
      encabezado.values = ['Folio', 'Fecha', 'Donante', 'Libro', 'Cantidad', 'Valor estimado (MXN)'];
      encabezado.height = 25;
      for (let columna = 1; columna <= 6; columna++) {
        const celda = encabezado.getCell(columna);
        celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF315A86' } };
        celda.alignment = { vertical: 'middle' };
      }
      for (const d of registros) {
        const fila = hoja.addRow({
          folio: `#${d.idDonacion}`,
          fecha: d.fechaDonacion || '',
          donante: d.nombreDonante || '',
          libro: d.recursoDocumental?.titulo || 'Sin título',
          cantidad: Number(d.cantidad ?? 0),
          valor: Number(d.precioEstimado ?? 0)
        });
        fila.getCell(6).numFmt = '"MX$"#,##0.00';
        for (let columna = 1; columna <= 6; columna++) {
          const celda = fila.getCell(columna);
          celda.alignment = { vertical: 'middle', wrapText: true };
          if (fila.number % 2 === 0) {
            celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5FA' } };
          }
        }
      }
      hoja.autoFilter = { from: 'A4', to: `F${hoja.lastRow?.number ?? 4}` };
      const buffer = await libro.xlsx.writeBuffer();
      const archivo = new Blob([buffer as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `reporte_donaciones_${this.fechaHoy()}.xlsx`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch {
      this.error = 'No se pudo generar el archivo Excel.';
    }
    this.cdr.markForCheck();
  }

  nuevo(): void {
    this.editandoId = null;
    this.modo = 'existente';
    this.form = this.nuevoFormulario();
    this.error = '';
    this.mostrarFormulario = true;
  }
  editar(d: Donacion): void {
    this.editandoId = d.idDonacion;
    this.modo = 'existente';
    this.form = {
      nombreDonante: d.nombreDonante,
      fechaDonacion: d.fechaDonacion,
      cantidad: d.cantidad,
      precioEstimado: d.precioEstimado,
      observaciones: d.observaciones ?? '',
      idRecursoDocumental: d.recursoDocumental?.idRecursoDocumental ?? null,
      libroNuevo: null
    };
    this.error = '';
    this.mostrarFormulario = true;
  }
  cancelar(): void { this.mostrarFormulario = false; }
  cambiarModo(): void {
    this.form.idRecursoDocumental = null;
    this.form.libroNuevo = this.modo === 'nuevo' ? this.libroVacio() : null;
  }
  guardar(): void {
    this.error = '';
    if (!this.form.nombreDonante.trim() || !this.form.fechaDonacion ||
        !Number.isInteger(Number(this.form.cantidad)) || Number(this.form.cantidad) < 1) {
      this.error = 'Indica donante, fecha y cantidad válida.'; return;
    }
    if (this.form.precioEstimado != null && Number(this.form.precioEstimado) < 0) {
      this.error = 'El valor estimado no puede ser negativo.'; return;
    }
    if (this.modo === 'existente' && this.form.idRecursoDocumental == null) {
      this.error = 'Selecciona un recurso del catálogo.'; return;
    }
    if (this.modo === 'nuevo' && !this.form.libroNuevo?.titulo.trim()) {
      this.error = 'Escribe el título del libro nuevo.'; return;
    }
    const payload: DonacionRequest = {
      ...this.form,
      cantidad: Number(this.form.cantidad),
      precioEstimado: this.form.precioEstimado == null ? null : Number(this.form.precioEstimado),
      idRecursoDocumental: this.modo === 'existente' ? Number(this.form.idRecursoDocumental) : null,
      libroNuevo: this.modo === 'nuevo' ? this.form.libroNuevo : null
    };
    this.guardando = true;
    const request = this.editandoId == null
      ? this.api.crear(payload)
      : this.api.actualizar(this.editandoId, payload);
    request.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.mensaje = this.editandoId == null ? 'Donación registrada e inventario actualizado.'
          : 'Donación actualizada e inventario ajustado.';
        this.cargar();
      },
      error: err => {
        this.guardando = false;
        this.error = this.errorHttp(err, 'No fue posible guardar la donación.');
        this.cdr.markForCheck();
      }
    });
  }
  eliminar(d: Donacion): void {
    if (!confirm(`¿Eliminar la donación #${d.idDonacion}? Se descontarán sus ejemplares del inventario.`)) return;
    this.guardando = true;
    this.error = '';
    this.api.eliminar(d.idDonacion).subscribe({
      next: () => {
        this.guardando = false;
        this.mensaje = 'Donación eliminada e inventario ajustado.';
        this.cargar();
      },
      error: err => {
        this.guardando = false;
        this.error = this.errorHttp(err, 'No se pudo eliminar la donación.');
        this.cdr.markForCheck();
      }
    });
  }
  private errorHttp(err: any, fallback: string): string {
    return err?.error?.detail || err?.error?.message || fallback;
  }
}
