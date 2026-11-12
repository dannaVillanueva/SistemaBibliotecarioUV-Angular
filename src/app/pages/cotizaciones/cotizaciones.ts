import * as ExcelJS from 'exceljs';
import { CommonModule } from '@angular/common';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
  Academia,
  ProgramaEducativo,
  RecursoDocumental
} from '../../models/recurso.model';

import {
  Cotizacion,
  DetalleCotizacion
} from '../../models/cotizacion.model';

import { CotizacionesService, HistorialCotizacion } from '../../core/services/cotizaciones.service';

interface RenglonCotizacion {
  idDetalleCotizacion?: number;
  origen: 'catalogo' | 'externo';

  idRecursoDocumental: number | null;

  tituloExterno: string;
  autorExterno: string;
  isbnExterno: string;
  editorialExterna: string;
  modoEditorial: 'existente' | 'nueva';
  idEditorial: number | null;
  urlCotizacion: string;
  estadoAdquisicion: string;
  edicionExterna: string;
  anioExterno: number | null;

  idProgramaEducativo: number | null;
  idAcademia: number | null;

  cantidad: number;
  precioUnitarioEstimado: number;
  filu: string;
}


interface LibroHistorico {
  idDetalleCotizacion?: number | null;
  idRecursoDocumental?: number | null;
  tituloExterno?: string | null;
  autorExterno?: string | null;
  isbnExterno?: string | null;
  editorialExterna?: string | null;
  idEditorial?: number | null;
  urlCotizacion?: string | null;
  estadoAdquisicion?: string | null;
  edicionExterna?: string | null;
  anioExterno?: number | null;
  idProgramaEducativo?: number | null;
  idAcademia?: number | null;
  cantidad?: number | null;
  precioUnitarioEstimado?: number | null;
  subtotal?: number | null;
  filu?: string | null;
}

interface VersionHistorica {
  idCotizacion?: number | null;
  fechaSolicitud?: string | null;
  estado?: string | null;
  observaciones?: string | null;
  solicitante?: string | null;
  correoSolicitante?: string | null;
  telefonoSolicitante?: string | null;
  dependencia?: string | null;
  justificacion?: string | null;
  proveedorSugerido?: string | null;
  libros?: LibroHistorico[];
}

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cotizaciones.html',
  styleUrl: './cotizaciones.scss'
})
class Cotizaciones implements OnInit {

  historial: HistorialCotizacion[] = [];
  historialVisible = false;
  filtroHistorial = '';
  cotizacionHistorialId: number | null = null;
  cotizaciones: Cotizacion[] = [];
  detalles: DetalleCotizacion[] = [];

  recursos: RecursoDocumental[] = [];
  programas: ProgramaEducativo[] = [];
  academias: Academia[] = [];
  editoriales: { idEditorial: number; nombre: string }[] = [];

  cargando = false;
  guardando = false;

  mensaje = '';
  error = '';

  filtro = '';
  filtroEstado = '';

  fechaReporteInicio = '';
  fechaReporteFin = '';
  exportandoExcel = false;

  mostrandoFormulario = false;

  editandoId: number | null = null;
  detalleVisibleId: number | null = null;

  formulario: Cotizacion = this.nuevaCotizacion();

  renglones: RenglonCotizacion[] = [
    this.nuevoRenglon()
  ];

  constructor(
    private servicio: CotizacionesService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  // ========================================
  // INICIALIZACIÓN
  // ========================================

  ngOnInit(): void {
    this.cargarDatos();
  }

  private fechaLocal(): string {
    const hoy = new Date();

    const local = new Date(
      hoy.getTime() - hoy.getTimezoneOffset() * 60000
    );

    return local.toISOString().slice(0, 10);
  }

  // ========================================
  // FORMULARIO NUEVO
  // ========================================

  private nuevaCotizacion(): Cotizacion {
    return {
      fechaSolicitud: this.fechaLocal(),
      estado: 'pendiente',
      observaciones: '',

      solicitante: '',
      correoSolicitante: '',
      telefonoSolicitante: '',
      dependencia: '',
      justificacion: '',
      proveedorSugerido: ''
    };
  }

  private nuevoRenglon(): RenglonCotizacion {
    return {
      origen: 'externo',

      idRecursoDocumental: null,

      tituloExterno: '',
      autorExterno: '',
      isbnExterno: '',
      editorialExterna: '',
      modoEditorial: 'existente',
      idEditorial: null,
      urlCotizacion: '',
      estadoAdquisicion: 'PENDIENTE',
      edicionExterna: '',
      anioExterno: null,

      idProgramaEducativo: null,
      idAcademia: null,

      cantidad: 1,
      precioUnitarioEstimado: 0,
      filu: 'NO'
    };
  }

  // ========================================
  // CARGAR INFORMACIÓN
  // ========================================

  cargarDatos(): void {
    this.cargando = true;
    // Conservar los mensajes de éxito durante la recarga.

    forkJoin({
      cotizaciones: this.servicio.listar(),
      historial: this.servicio.listarHistorial(),
      detalles: this.servicio.listarDetalles(),

      recursos: this.http.get<RecursoDocumental[]>(
        '/api/recursos'
      ),

      programas: this.http.get<ProgramaEducativo[]>(
        '/api/programas'
      ),

      academias: this.http.get<Academia[]>(
        '/api/academias'
      ),
      editoriales: this.http.get<{ idEditorial: number; nombre: string }[]>('/api/editoriales')
    })
      .pipe(
        finalize(() => {
          this.cargando = false;
          console.log('Carga de cotizaciones finalizada');
        })
      )
      .subscribe({
        next: data => {
          this.historial = data.historial;
          this.cotizaciones = data.cotizaciones;
          this.detalles = data.detalles;
          this.recursos = data.recursos;
          this.programas = data.programas;
          this.academias = data.academias;
          this.editoriales = data.editoriales;

          this.cargando = false;
          this.cdr.markForCheck();
        },

        error: err => {
          console.error('Error al cargar cotizaciones:', err);

          this.error = 'No fue posible cargar los datos.';
          this.cargando = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ========================================
  // FILTROS
  // ========================================

  get cotizacionesFiltradas(): Cotizacion[] {
    const texto = this.filtro.trim().toLowerCase();

    return this.cotizaciones
      .filter(c =>
        (
          !this.filtroEstado ||
          (c.estado || '').toLowerCase() ===
          this.filtroEstado.toLowerCase()
        ) &&
        (
          !texto ||
          [
            c.idCotizacion,
            c.fechaSolicitud,
            c.estado,
            c.observaciones,
            c.solicitante,
            c.correoSolicitante,
            c.dependencia
          ].some(valor =>
            String(valor ?? '')
              .toLowerCase()
              .includes(texto)
          )
        )
      )
      .sort(
        (a, b) =>
          (b.idCotizacion ?? 0) -
          (a.idCotizacion ?? 0)
      );
  }

  // ========================================
  // RESUMEN
  // ========================================

  get totalCotizaciones(): number {
    return this.cotizaciones.length;
  }

  contarEstado(estado: string): number {
    return this.cotizaciones.filter(
      c =>
        (c.estado || '').toLowerCase() ===
        estado.toLowerCase()
    ).length;
  }

  // ========================================
  // DETALLES
  // ========================================

  detallesDe(
    id: number | undefined
  ): DetalleCotizacion[] {

    return this.detalles.filter(
      d => d.cotizacion?.idCotizacion === id
    );
  }

  totalDe(id: number | undefined): number {
    return this.detallesDe(id).reduce(
      (suma, detalle) =>
        suma +
        Number(detalle.cantidad || 0) *
        Number(detalle.precioUnitarioEstimado || 0),
      0
    );
  }

  get totalFormulario(): number {
    return this.renglones.reduce(
      (suma, renglon) =>
        suma + this.subtotal(renglon),
      0
    );
  }

  subtotal(d: RenglonCotizacion): number {
    return (
      Number(d.cantidad || 0) *
      Number(d.precioUnitarioEstimado || 0)
    );
  }

  nombreRecurso(
    id: number | undefined
  ): string {

    return this.recursos.find(
      r => r.idRecursoDocumental === id
    )?.titulo ?? `Recurso #${id ?? '?'}`;
  }

  nombreDetalle(d: DetalleCotizacion): string {
    return (
      d.tituloExterno?.trim() ||
      this.nombreRecurso(
        d.recursoDocumental?.idRecursoDocumental
      )
    );
  }

  // ========================================
  // CAMBIAR ORIGEN DEL LIBRO
  // ========================================

  cambiarOrigen(d: RenglonCotizacion): void {

    if (d.origen === 'externo') {
      d.idRecursoDocumental = null;

    } else {
      d.tituloExterno = '';
      d.autorExterno = '';
      d.isbnExterno = '';
      d.editorialExterna = '';
      d.idEditorial = null;
      d.modoEditorial = 'existente';
      d.edicionExterna = '';
      d.anioExterno = null;
    }
  }

  cambiarModoEditorial(d: RenglonCotizacion): void {
    d.idEditorial = null;
    d.editorialExterna = '';
  }

  // ========================================
  // NUEVA COTIZACIÓN
  // ========================================

  abrirNuevo(): void {
    this.mensaje = '';
    this.error = '';

    this.editandoId = null;

    this.formulario = this.nuevaCotizacion();

    this.renglones = [
      this.nuevoRenglon()
    ];

    this.mostrandoFormulario = true;
  }

  // ========================================
  // EDITAR COTIZACIÓN
  // ========================================

  editar(c: Cotizacion): void {
    this.mensaje = '';
    this.error = '';

    this.editandoId = c.idCotizacion ?? null;

    this.formulario = {
      ...c
    };

    this.renglones = this.detallesDe(
      c.idCotizacion
    ).map(d => ({

      idDetalleCotizacion:
      d.idDetalleCotizacion,

      origen:
        d.recursoDocumental?.idRecursoDocumental != null
          ? 'catalogo' as const
          : 'externo' as const,

      idRecursoDocumental:
        d.recursoDocumental?.idRecursoDocumental ?? null,

      tituloExterno:
        d.tituloExterno ?? '',

      autorExterno:
        d.autorExterno ?? '',

      isbnExterno:
        d.isbnExterno ?? '',

      editorialExterna:
        d.editorialExterna ?? '',
      idEditorial: d.editorial?.idEditorial ?? null,
      modoEditorial: d.editorial?.idEditorial != null ? 'existente' as const : (d.editorialExterna ? 'nueva' as const : 'existente' as const),
      urlCotizacion: d.urlCotizacion ?? '',
      estadoAdquisicion: d.estadoAdquisicion ?? 'PENDIENTE',

      edicionExterna:
        d.edicionExterna ?? '',

      anioExterno:
        d.anioExterno ?? null,

      idProgramaEducativo:
        d.programaEducativo?.idProgramaEducativo ?? null,

      idAcademia:
        d.academia?.idAcademia ?? null,

      cantidad:
      d.cantidad,

      precioUnitarioEstimado:
        Number(d.precioUnitarioEstimado),

      filu:
        d.filu || 'NO'
    }));

    if (!this.renglones.length) {
      this.renglones = [
        this.nuevoRenglon()
      ];
    }

    this.mostrandoFormulario = true;
  }

  // ========================================
  // AGREGAR / QUITAR LIBROS
  // ========================================

  agregarRenglon(): void {
    this.renglones.push(
      this.nuevoRenglon()
    );
  }

  quitarRenglon(indice: number): void {
    if (this.renglones.length > 1) {
      this.renglones.splice(indice, 1);
    }
  }

  cancelar(): void {
    this.mostrandoFormulario = false;
  }

  verDetalles(id: number): void {
    this.detalleVisibleId =
      this.detalleVisibleId === id
        ? null
        : id;
  }

  // ========================================
  // CONSTRUIR DETALLE PARA BACKEND
  // ========================================

  private crearDetalle(
    c: Cotizacion,
    d: RenglonCotizacion
  ): DetalleCotizacion {

    return {
      cantidad: Number(d.cantidad),

      precioUnitarioEstimado:
        Number(d.precioUnitarioEstimado),

      subtotal:
        this.subtotal(d),

      filu:
      d.filu,

      cotizacion: c,

      recursoDocumental:
        d.origen === 'catalogo' &&
        d.idRecursoDocumental != null
          ? {
            idRecursoDocumental:
            d.idRecursoDocumental
          } as RecursoDocumental
          : null,

      tituloExterno:
        d.origen === 'externo'
          ? d.tituloExterno.trim()
          : null,

      autorExterno:
        d.origen === 'externo'
          ? d.autorExterno.trim()
          : null,

      isbnExterno:
        d.origen === 'externo'
          ? d.isbnExterno.trim()
          : null,

      editorialExterna:
        d.origen === 'externo' && d.modoEditorial === 'nueva'
          ? d.editorialExterna.trim()
          : null,
      editorial: d.origen === 'externo' && d.modoEditorial === 'existente' && d.idEditorial != null
        ? { idEditorial: d.idEditorial } : null,
      urlCotizacion: d.urlCotizacion.trim() || null,
      estadoAdquisicion: d.estadoAdquisicion,

      edicionExterna:
        d.origen === 'externo'
          ? d.edicionExterna.trim()
          : null,

      anioExterno:
        d.origen === 'externo'
          ? d.anioExterno
          : null,

      programaEducativo:
        d.idProgramaEducativo != null
          ? {
            idProgramaEducativo:
            d.idProgramaEducativo
          } as ProgramaEducativo
          : null,

      academia:
        d.idAcademia != null
          ? {
            idAcademia:
            d.idAcademia
          } as Academia
          : null
    };
  }

  // ========================================
  // VALIDACIONES
  // ========================================

  private validar(): boolean {

    if (
      !this.formulario.fechaSolicitud ||
      !this.formulario.estado?.trim()
    ) {
      this.error =
        'Indica la fecha y el estado de la cotización.';

      return false;
    }

    if (!this.formulario.solicitante?.trim()) {
      this.error =
        'Escribe el nombre del docente solicitante.';

      return false;
    }

    if (
      !this.renglones.length ||
      this.renglones.some(d =>

        (
          d.origen === 'catalogo' &&
          d.idRecursoDocumental == null
        ) ||

        (
          d.origen === 'externo' &&
          !d.tituloExterno.trim()
        ) ||

        !Number.isInteger(Number(d.cantidad)) ||

        Number(d.cantidad) <= 0 ||

        !Number.isFinite(
          Number(d.precioUnitarioEstimado)
        ) ||

        Number(d.precioUnitarioEstimado) < 0 ||

        this.subtotal(d) > 99999999.99 ||
        (d.origen === 'externo' && d.modoEditorial === 'nueva' && !d.editorialExterna.trim()) ||
        (d.origen === 'externo' && d.modoEditorial === 'existente' && d.idEditorial == null && d.editorialExterna.trim().length > 0) ||
        (!!d.urlCotizacion.trim() && !/^https?:\/\/[^\s/]+/i.test(d.urlCotizacion.trim()))
      )
    ) {
      this.error =
        'Revisa los libros: indica un título o recurso, ' +
        'cantidad positiva y precio válido.';

      return false;
    }

    return true;
  }

  // ========================================
  // GUARDAR COTIZACIÓN
  // ========================================

  guardar(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.validar()) {
      return;
    }

    this.guardando = true;

    const idAnterior = this.editandoId;

    // ======================================
    // CREAR COTIZACIÓN COMPLETA
    // ======================================

    if (idAnterior === null) {

      const cotizacion: Cotizacion = {
        ...this.formulario
      };

      const detalles: DetalleCotizacion[] =
        this.renglones.map(
          d => this.crearDetalle(cotizacion, d)
        );

      this.servicio.guardarCompleta({
        cotizacion,
        detalles
      })
        .pipe(
          finalize(() => { this.guardando = false; this.cdr.markForCheck(); })
        )
        .subscribe({
          next: () => {
            this.mostrandoFormulario = false;

            this.mensaje =
              'Cotización registrada con todos sus libros.';

            this.cargarDatos();
          },

          error: err => {
            this.mostrarError(
              err,
              'No se pudo guardar la cotización.'
            );
          }
        });

      return;
    }

    // ======================================
    // ACTUALIZAR COTIZACIÓN EXISTENTE
    // ======================================

    const cotizacion: Cotizacion = { ...this.formulario };
    const detalles = this.renglones.map(d => ({
      ...this.crearDetalle(cotizacion, d),
      idDetalleCotizacion: d.idDetalleCotizacion
    }));

    this.servicio.actualizarCompleta(idAnterior, { cotizacion, detalles })
      .pipe(finalize(() => {
        this.guardando = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.mostrandoFormulario = false;
          this.mensaje = 'Cotización y libros actualizados. Se guardó una versión histórica.';
          this.cargarDatos();
        },
        error: err => {
          this.mostrarError(err, 'No se pudo actualizar la cotización.');
          this.cdr.markForCheck();
        }
      });
  }

  get historialFiltrado(): HistorialCotizacion[] {
    const filtro = this.filtroHistorial.trim().toLowerCase();
    return this.historial.filter(h =>
      (this.cotizacionHistorialId === null || h.idCotizacion === this.cotizacionHistorialId) &&
      (!filtro || [h.idCotizacion, h.accion, h.usuario, h.observaciones, h.estadoNuevo]
        .some(v => String(v ?? '').toLowerCase().includes(filtro)))
    );
  }

  verHistorial(id?: number): void {
    this.historialVisible = true;
    this.cotizacionHistorialId = id ?? null;
    this.cdr.markForCheck();
  }

  cerrarHistorial(): void {
    this.historialVisible = false;
    this.cotizacionHistorialId = null;
  }

  // Interpreta la copia histórica sin modificar el JSON almacenado en MySQL.
  leerVersion(json: string | null | undefined): VersionHistorica | null {
    if (!json) return null;
    try {
      const valor: unknown = JSON.parse(json);
      if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) return null;
      const datos = valor as VersionHistorica;
      return { ...datos, libros: Array.isArray(datos.libros) ? datos.libros : [] };
    } catch {
      return null;
    }
  }

  nombreLibroHistorico(libro: LibroHistorico): string {
    if (libro.tituloExterno?.trim()) return libro.tituloExterno.trim();
    if (libro.idRecursoDocumental != null) return this.nombreRecurso(libro.idRecursoDocumental);
    return 'Libro sin título registrado';
  }

  nombreProgramaHistorico(id: number | null | undefined): string {
    if (id == null) return 'No especificado';
    return this.programas.find(p => p.idProgramaEducativo === id)?.nombre ?? `Programa #${id}`;
  }

  nombreAcademiaHistorica(id: number | null | undefined): string {
    if (id == null) return 'No especificada';
    return this.academias.find(a => a.idAcademia === id)?.nombre ?? `Academia #${id}`;
  }

  totalVersion(version: VersionHistorica): number {
    return (version.libros ?? []).reduce((suma, libro) =>
      suma + Number(libro.cantidad ?? 0) * Number(libro.precioUnitarioEstimado ?? 0), 0);
  }

  // Permite consultar el JSON original cuando una versión sea ilegible.
  formatearSnapshot(json: string | null): string {
    if (!json) return 'Sin datos para esta versión.';
    try { return JSON.stringify(JSON.parse(json), null, 2); }
    catch { return json; }
  }

  // ========================================
  // APROBAR O RECHAZAR COTIZACIÓN
  // ========================================

  cambiarEstado(c: Cotizacion, estado: 'aprobada' | 'rechazada'): void {
    if (c.idCotizacion == null || this.guardando) return;
    if ((c.estado || '').toLowerCase() !== 'pendiente') {
      this.error = 'Solo puedes resolver cotizaciones pendientes.';
      this.cdr.markForCheck();
      return;
    }

    const verbo = estado === 'aprobada' ? 'aprobar' : 'rechazar';
    if (!confirm(`¿Deseas ${verbo} la cotización #${c.idCotizacion}?`)) return;

    this.guardando = true;
    this.error = '';
    this.mensaje = '';

    this.servicio.cambiarEstado(c.idCotizacion, estado)
      .pipe(finalize(() => {
        this.guardando = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.mensaje = `Cotización ${estado} correctamente.`;
          this.cargarDatos();
        },
        error: err => {
          this.mostrarError(err, 'No se pudo cambiar el estado.');
          this.cdr.markForCheck();
        }
      });
  }

  // ========================================
  // ELIMINAR COTIZACIÓN
  // ========================================

  eliminar(c: Cotizacion): void {

    if (!c.idCotizacion) {
      return;
    }

    if (
      !confirm(
        `¿Eliminar la cotización #${c.idCotizacion} ` +
        'y todos sus detalles?'
      )
    ) {
      return;
    }

    this.error = '';
    this.mensaje = '';
    this.guardando = true;

    this.servicio.eliminar(
      c.idCotizacion
    )
      .pipe(
        finalize(
          () => { this.guardando = false; this.cdr.markForCheck(); }
        )
      )
      .subscribe({
        next: () => {
          this.mensaje =
            'Cotización eliminada.';

          this.cargarDatos();
        },

        error: err => {
          this.mostrarError(
            err,
            'No se pudo eliminar la cotización.'
          );
        }
      });
  }

  // ========================================
  // REPORTE EXCEL POR FECHAS (UN LIBRO POR FILA)
  // ========================================

  async exportarExcel(): Promise<void> {
    this.error = '';
    this.mensaje = '';

    const inicio = this.fechaReporteInicio;
    const fin = this.fechaReporteFin;

    if (!inicio || !fin) {
      this.error = 'Selecciona la fecha inicial y final del reporte.';
      return;
    }

    if (inicio > fin) {
      this.error = 'La fecha inicial no puede ser posterior a la fecha final.';
      return;
    }

    if (this.cargando || this.exportandoExcel) return;

    // Filtrar cotizaciones por rango de fechas.
    const cotizacionesPeriodo = this.cotizaciones
      .filter(c => {
        const fecha = String(c.fechaSolicitud ?? '').slice(0, 10);
        return fecha >= inicio && fecha <= fin;
      })
      .sort((a, b) =>
        String(a.fechaSolicitud ?? '').localeCompare(
          String(b.fechaSolicitud ?? '')
        )
      );

    const filas: Array<(string | number)[]> = [];

    for (const cotizacion of cotizacionesPeriodo) {
      const fechaCotizacion = String(
        cotizacion.fechaSolicitud ?? ''
      ).slice(0, 10);

      for (const detalle of this.detallesDe(cotizacion.idCotizacion)) {
        const recurso = this.recursos.find(
          r =>
            r.idRecursoDocumental ===
            detalle.recursoDocumental?.idRecursoDocumental
        );

        const recursoDatos = recurso as unknown as
          Record<string, unknown> | undefined;

        const programaId =
          detalle.programaEducativo?.idProgramaEducativo;

        const academiaId =
          detalle.academia?.idAcademia;

        const programa =
          this.programas.find(
            p => p.idProgramaEducativo === programaId
          )?.nombre ??
          detalle.programaEducativo?.nombre ??
          'Sin especificar';

        const academia =
          this.academias.find(
            a => a.idAcademia === academiaId
          )?.nombre ??
          detalle.academia?.nombre ??
          'Sin especificar';

        const isbn = String(
          detalle.isbnExterno || recursoDatos?.['isbn'] || ''
        );

        const titulo =
          detalle.tituloExterno?.trim() ||
          recurso?.titulo ||
          'Sin título';

        const tipoDato = recursoDatos?.['tipoRecurso'];

        const tipo =
          tipoDato && typeof tipoDato === 'object'
            ? String(
              (tipoDato as Record<string, unknown>)['nombre'] ??
              'Libro'
            )
            : String(recursoDatos?.['tipo'] || 'Libro');

        const editorialDato = recursoDatos?.['editorial'];

        const editorialCatalogo =
          editorialDato && typeof editorialDato === 'object'
            ? String(
              (editorialDato as Record<string, unknown>)['nombre'] ??
              ''
            )
            : '';

        const editorial =
          detalle.editorial?.nombre ||
          detalle.editorialExterna ||
          editorialCatalogo ||
          'Sin editorial';

        const cantidad = Number(detalle.cantidad || 0);

        const precio = Number(
          detalle.precioUnitarioEstimado || 0
        );

        // La fecha se agrega como tercera columna.
        filas.push([
          programa,
          academia,
          fechaCotizacion,
          isbn,
          titulo,
          tipo,
          editorial,
          cantidad,
          precio,
          cantidad * precio,
          String(detalle.filu ?? 'NO').toUpperCase() === 'SI'
            ? 'Sí'
            : 'No'
        ]);
      }
    }

    if (!filas.length) {
      this.error =
        'No hay libros de cotizaciones registrados en ese rango de fechas.';
      return;
    }

    this.exportandoExcel = true;
    this.cdr.markForCheck();

    try {
      const libro = new ExcelJS.Workbook();

      libro.creator =
        'Biblioteca Ing. Manuel Lima Flores - FCA';

      const hoja = libro.addWorksheet('Detalle');

      // 11 columnas.
      hoja.columns = [
        { width: 26 }, // A Programa educativo
        { width: 24 }, // B Academia
        { width: 20 }, // C Fecha de cotización
        { width: 20 }, // D ISBN
        { width: 48 }, // E Título
        { width: 18 }, // F Tipo
        { width: 29 }, // G Editorial
        { width: 13 }, // H Cantidad
        { width: 25 }, // I Precio unitario
        { width: 21 }, // J Subtotal
        { width: 12 }  // K FILU
      ];

      // Título del reporte.
      hoja.mergeCells('A1:K1');

      hoja.getCell('A1').value = 'REPORTE DE COTIZACIONES';

      hoja.getCell('A1').font = {
        name: 'Calibri',
        size: 16,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };

      hoja.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF193A60' }
      };

      hoja.getCell('A1').alignment = {
        vertical: 'middle'
      };

      hoja.getRow(1).height = 34;

      // Subtítulo y periodo seleccionado.
      hoja.mergeCells('A2:K2');

      hoja.getCell('A2').value =
        `Biblioteca Ing. Manuel Lima Flores - FCA | ` +
        `Del ${inicio} al ${fin}`;

      hoja.getCell('A2').font = {
        name: 'Calibri',
        size: 11,
        color: { argb: 'FF365C86' }
      };

      hoja.getRow(2).height = 24;

      const encabezados = [
        'Programa educativo',
        'Academia',
        'Fecha de cotización',
        'ISBN',
        'Título',
        'Tipo',
        'Editorial',
        'Cantidad',
        'Precio unitario estimado (MXN)',
        'Subtotal (MXN)',
        'FILU'
      ];

      const filaEncabezado = 4;

      encabezados.forEach((texto, indice) => {
        const celda = hoja.getCell(
          filaEncabezado,
          indice + 1
        );

        celda.value = texto;

        celda.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: 'FFFFFFFF' }
        };

        celda.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF315C88' }
        };

        celda.alignment = {
          vertical: 'middle',
          wrapText: true
        };
      });

      hoja.getRow(filaEncabezado).height = 34;

      // Convertir YYYY-MM-DD a fecha real de Excel.
      const convertirFechaExcel = (valor: string): Date | null => {
        const partes = valor.split('-').map(Number);

        if (
          partes.length !== 3 ||
          !partes.every(Number.isInteger)
        ) {
          return null;
        }

        const [anio, mes, dia] = partes;
        const fecha = new Date(anio, mes - 1, dia);

        if (
          fecha.getFullYear() !== anio ||
          fecha.getMonth() !== mes - 1 ||
          fecha.getDate() !== dia
        ) {
          return null;
        }

        return fecha;
      };

      // Agregar los registros al Excel.
      filas.forEach((datos, indice) => {
        const numeroFila =
          filaEncabezado + indice + 1;

        datos.forEach((valor, columna) => {
          const celda = hoja.getCell(
            numeroFila,
            columna + 1
          );

          celda.value = valor;

          celda.font = {
            name: 'Calibri',
            size: 10,
            color: { argb: 'FF17324E' }
          };

          celda.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
              argb:
                indice % 2 === 0
                  ? 'FFFFFFFF'
                  : 'FFEAF1F9'
            }
          };

          celda.alignment = {
            vertical: 'middle',
            wrapText: true
          };

          // Columna C: Fecha de cotización.
          if (columna === 2) {
            const fecha = convertirFechaExcel(
              String(valor)
            );

            if (fecha) {
              celda.value = fecha;
              celda.numFmt = 'dd/mm/yyyy';
            }

            celda.alignment = {
              horizontal: 'center',
              vertical: 'middle'
            };
          }

          // Columna D: ISBN como texto.
          if (columna === 3) {
            celda.numFmt = '@';
          }

          // Columna H: Cantidad.
          if (columna === 7) {
            celda.alignment = {
              horizontal: 'center',
              vertical: 'middle'
            };
          }

          // Columnas I y J: Importes.
          if (columna === 8 || columna === 9) {
            celda.numFmt = '"MX$"#,##0.00';

            celda.alignment = {
              horizontal: 'right',
              vertical: 'middle'
            };
          }
        });

        hoja.getRow(numeroFila).height = 32;
      });

      // Total estimado del reporte.
      const filaTotal =
        filaEncabezado + filas.length + 1;

      hoja.getCell(`I${filaTotal}`).value =
        'TOTAL ESTIMADO';

      hoja.getCell(`J${filaTotal}`).value = {
        formula:
          `SUM(J${filaEncabezado + 1}:J${filaTotal - 1})`,
        result: filas.reduce(
          (suma, fila) => suma + Number(fila[9]),
          0
        )
      };

      hoja.getCell(`J${filaTotal}`).numFmt =
        '"MX$"#,##0.00';

      for (const columna of [9, 10]) {
        const celda = hoja.getCell(
          filaTotal,
          columna
        );

        celda.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' }
        };

        celda.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF193A60' }
        };
      }

      // Filtros de Excel.
      hoja.autoFilter = {
        from: {
          row: filaEncabezado,
          column: 1
        },
        to: {
          row: filaEncabezado + filas.length,
          column: 11
        }
      };

      // Mantener los encabezados visibles.
      hoja.views = [
        {
          state: 'frozen',
          ySplit: 4
        }
      ];

      // Configuración de impresión.
      hoja.pageSetup = {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      };

      hoja.pageSetup.printArea =
        `A1:K${filaTotal}`;

      // Generar el archivo XLSX.
      const buffer = await libro.xlsx.writeBuffer();

      const archivo = new Blob(
        [buffer as BlobPart],
        {
          type:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      );

      const url = URL.createObjectURL(archivo);

      const enlace = document.createElement('a');

      enlace.href = url;

      enlace.download =
        `reporte_cotizaciones_${inicio}_al_${fin}.xlsx`;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      this.mensaje =
        `Reporte generado: ${filas.length} libro(s) ` +
        `de ${cotizacionesPeriodo.length} cotización(es).`;

    } catch (err) {
      console.error(
        'Error al generar reporte de cotizaciones:',
        err
      );

      this.error =
        'No se pudo generar el archivo Excel.';

    } finally {
      this.exportandoExcel = false;
      this.cdr.markForCheck();
    }
  }

  // ========================================
  // MANEJO DE ERRORES
  // ========================================

  private mostrarError(
    err: unknown,
    fallback: string
  ): void {

    const httpError =
      err as HttpErrorResponse;

    this.error =
      httpError?.error?.message ||
      httpError?.message ||
      fallback;
  }
}

export default Cotizaciones
