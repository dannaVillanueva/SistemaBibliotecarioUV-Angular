import * as ExcelJS from 'exceljs';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { RecursoService } from '../../core/services/recurso.service';
import { CatalogoService } from '../../core/services/catalogo';
import {
  Academia, Editorial, ExperienciaEducativa, ProgramaEducativo,
  RecursoDocumental, RecursoFiltros, RecursoRegistroRequestDTO,
  VinculacionAcademicaRequestDTO
} from '../../models/recurso.model';

@Component({
  selector: 'app-recursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recursos.html',
  styleUrl: './recursos.scss'
})
export class Recursos implements OnInit {
  recursos: RecursoDocumental[] = [];
  editoriales: Editorial[] = [];
  experienciasEducativas: ExperienciaEducativa[] = [];
  academias: Academia[] = [];
  programasEducativos: ProgramaEducativo[] = [];

  cargando = false;
  cargandoCatalogos = false;
  guardando = false;
  mensajeError = '';
  mensajeCatalogos = '';
  mensajeFormulario = '';
  mostrarFiltros = false;
  mostrarFormulario = false;
  modoFormulario: 'nuevo' | 'editar' = 'nuevo';
  idRecursoEditando: number | null = null;
  eliminandoId: number | null = null;
  mensajeExito = '';
  ordenCampo: 'titulo' | 'autor' | 'anio' | 'cantidad' = 'titulo';
  ordenAscendente = true;
  recursoSeleccionado: RecursoDocumental | null = null;
  filtros: RecursoFiltros = this.crearFiltrosVacios();
  nuevoRecurso: RecursoDocumental = this.crearRecursoVacio();

  modoEditorial: 'existente' | 'nueva' = 'existente';
  idEditorialSeleccionada: number | null = null;
  nombreNuevaEditorial = '';

  idProgramaSeleccionado: number | null = null;
  idAcademiaSeleccionada: number | null = null;
  idExperienciaSeleccionada: number | null = null;
  vinculacionesSeleccionadas: VinculacionAcademicaRequestDTO[] = [];

  constructor(
    private recursoService: RecursoService,
    private catalogoService: CatalogoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarRecursos();
    this.cargarCatalogos();
  }

  crearFiltrosVacios(): RecursoFiltros {
    return {
      titulo: '', autor: '', isbn: '', tipo: '', anio: '', idEditorial: null,
      enCatalogoBiblioFca: null, idExperienciaEducativa: null,
      idAcademia: null, idProgramaEducativo: null
    };
  }

  crearRecursoVacio(): RecursoDocumental {
    return {
      titulo: '', autor: null, edicion: null, anio: null, isbn: null,
      cantidad: 1, movimiento: null, enCatalogoBiblioFca: false,
      observaciones: null, tipo: null, editorial: null,
      experienciasEducativas: [], vinculacionesAcademicas: [],
      formato: 'FISICO', urlRecurso: null
    };
  }

  cargarRecursos(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.cdr.markForCheck();
    this.recursoService.listar().subscribe({
      next: respuesta => {
        this.recursos = respuesta;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Error al cargar recursos:', error);
        this.cargando = false;
        this.mensajeError = error.status === 401 || error.status === 403
          ? 'No tienes autorización para consultar los recursos.'
          : error.status === 0
            ? 'No fue posible conectar con el servidor.'
            : 'Ocurrió un error al consultar los recursos.';
        this.cdr.markForCheck();
      }
    });
  }

  cargarCatalogos(): void {
    this.cargandoCatalogos = true;
    this.mensajeCatalogos = '';
    this.cdr.markForCheck();
    forkJoin({
      editoriales: this.catalogoService.listarEditoriales(),
      experiencias: this.catalogoService.listarExperiencias(),
      academias: this.catalogoService.listarAcademias(),
      programas: this.catalogoService.listarProgramas()
    }).subscribe({
      next: respuesta => {
        this.editoriales = respuesta.editoriales;
        this.experienciasEducativas = respuesta.experiencias;
        this.academias = respuesta.academias;
        this.programasEducativos = respuesta.programas;
        this.cargandoCatalogos = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Error al cargar catálogos:', error);
        this.cargandoCatalogos = false;
        this.mensajeCatalogos = 'No fue posible cargar los catálogos. Revisa las rutas de programas y academias.';
        this.cdr.markForCheck();
      }
    });
  }

  buscar(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.cdr.markForCheck();
    this.recursoService.buscar(this.filtros).subscribe({
      next: respuesta => {
        this.recursos = respuesta;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Error al buscar recursos:', error);
        this.cargando = false;
        this.mensajeError = 'No fue posible realizar la búsqueda.';
        this.cdr.markForCheck();
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros = this.crearFiltrosVacios();
    this.cargarRecursos();
  }

  cambiarFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  verDetalle(recurso: RecursoDocumental): void {
    const id = recurso.idRecursoDocumental;
    if (id == null) return;
    this.recursoSeleccionado = recurso;
    this.recursoService.buscarPorId(id).subscribe({
      next: respuesta => {
        if (this.recursoSeleccionado?.idRecursoDocumental === id) {
          this.recursoSeleccionado = respuesta;
          this.cdr.markForCheck();
        }
      },
      error: error => console.error('Error al consultar detalle:', error)
    });
  }

  cerrarDetalle(): void {
    this.recursoSeleccionado = null;
  }

  abrirNuevoRecurso(): void {
    this.recursoSeleccionado = null;
    this.modoFormulario = 'nuevo';
    this.idRecursoEditando = null;
    this.nuevoRecurso = this.crearRecursoVacio();
    this.modoEditorial = 'existente';
    this.idEditorialSeleccionada = null;
    this.nombreNuevaEditorial = '';
    this.idProgramaSeleccionado = null;
    this.idAcademiaSeleccionada = null;
    this.idExperienciaSeleccionada = null;
    this.vinculacionesSeleccionadas = [];
    this.mensajeFormulario = '';
    this.mostrarFormulario = true;
    if (this.mensajeCatalogos) this.cargarCatalogos();
  }

  editarRecurso(recurso: RecursoDocumental): void {
    if (recurso.idRecursoDocumental == null) return;
    this.modoFormulario = 'editar';
    this.idRecursoEditando = recurso.idRecursoDocumental;
    this.recursoSeleccionado = null;
    this.nuevoRecurso = { ...recurso, formato: recurso.formato ?? 'FISICO', urlRecurso: recurso.urlRecurso ?? null };
    this.modoEditorial = 'existente';
    this.idEditorialSeleccionada = recurso.editorial?.idEditorial ?? null;
    this.nombreNuevaEditorial = '';
    this.idProgramaSeleccionado = null;
    this.idAcademiaSeleccionada = null;
    this.idExperienciaSeleccionada = null;
    this.vinculacionesSeleccionadas = (recurso.vinculacionesAcademicas ?? []).map(v => ({
      idProgramaEducativo: v.programaEducativo.idProgramaEducativo,
      idAcademia: v.academia.idAcademia,
      idExperienciaEducativa: v.experienciaEducativa.idExperienciaEducativa
    }));
    this.mensajeFormulario = '';
    this.mostrarFormulario = true;
    if (this.mensajeCatalogos) this.cargarCatalogos();
    this.recursoService.buscarPorId(recurso.idRecursoDocumental).subscribe({
      next: completo => {
        if (this.idRecursoEditando !== completo.idRecursoDocumental || !this.mostrarFormulario) return;
        this.nuevoRecurso = { ...completo, formato: completo.formato ?? 'FISICO', urlRecurso: completo.urlRecurso ?? null };
        this.idEditorialSeleccionada = completo.editorial?.idEditorial ?? null;
        this.vinculacionesSeleccionadas = (completo.vinculacionesAcademicas ?? []).map(v => ({
          idProgramaEducativo: v.programaEducativo.idProgramaEducativo,
          idAcademia: v.academia.idAcademia,
          idExperienciaEducativa: v.experienciaEducativa.idExperienciaEducativa
        }));
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Error al cargar recurso para editar:', error);
        this.mensajeFormulario = 'No fue posible cargar el detalle actualizado del recurso.';
        this.cdr.markForCheck();
      }
    });
  }

  confirmarEliminar(recurso: RecursoDocumental): void {
    const id = recurso.idRecursoDocumental;
    if (id == null || this.eliminandoId !== null) return;
    if (!window.confirm(`¿Eliminar definitivamente el recurso «${recurso.titulo}»? Esta acción no se puede deshacer.`)) return;
    this.eliminandoId = id;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.cdr.markForCheck();
    this.recursoService.eliminar(id).subscribe({
      next: () => {
        this.eliminandoId = null;
        this.recursoSeleccionado = null;
        this.mensajeExito = 'El recurso se eliminó correctamente.';
        this.cargarRecursos();
        this.cdr.markForCheck();
      },
      error: error => {
        this.eliminandoId = null;
        this.mensajeError = error.status === 403
          ? 'No tienes permisos para eliminar recursos.'
          : error.status === 409 || error.status === 500
            ? 'No se pudo eliminar. Puede haber registros relacionados con este recurso.'
            : 'No fue posible eliminar el recurso.';
        this.cdr.markForCheck();
      }
    });
  }

  get recursosOrdenados(): RecursoDocumental[] {
    const campo = this.ordenCampo;
    const sentido = this.ordenAscendente ? 1 : -1;
    return [...this.recursos].sort((a, b) => {
      if (campo === 'cantidad') return (a.cantidad - b.cantidad) * sentido;
      return String(a[campo] ?? '').localeCompare(String(b[campo] ?? ''), 'es', { numeric: true }) * sentido;
    });
  }

  cambiarOrden(campo: 'titulo' | 'autor' | 'anio' | 'cantidad'): void {
    if (this.ordenCampo === campo) this.ordenAscendente = !this.ordenAscendente;
    else { this.ordenCampo = campo; this.ordenAscendente = true; }
  }

  async exportarExcel(): Promise<void> {
    if (this.cargando || !this.recursosOrdenados.length) return;
    try {
      const libro = new ExcelJS.Workbook();
      libro.creator = 'Biblioteca Ing. Manuel Lima Flores - FCA';
      const hoja = libro.addWorksheet('Recursos documentales');
      const encabezados = ['ID', 'ISBN', 'Título', 'Autor', 'Tipo', 'Editorial', 'Edición', 'Año', 'Formato', 'URL', 'Cantidad', 'Movimiento', 'Catálogo FCA', 'Observaciones', 'Vinculaciones académicas'];
      const columnas = [9, 21, 49, 26, 17, 25, 15, 12, 17, 55, 13, 25, 17, 42, 70];
      hoja.columns = columnas.map(ancho => ({ width: ancho }));
      hoja.mergeCells(1, 1, 1, encabezados.length);
      const titulo = hoja.getCell('A1');
      titulo.value = 'REPORTE DE RECURSOS DOCUMENTALES';
      titulo.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF19395E' } };
      titulo.alignment = { vertical: 'middle', horizontal: 'left' };
      hoja.getRow(1).height = 34;
      hoja.mergeCells(2, 1, 2, encabezados.length);
      hoja.getCell('A2').value = 'Biblioteca Ing. Manuel Lima Flores · Facultad de Contaduría y Administración';
      hoja.getCell('A2').font = { color: { argb: 'FF58718D' }, italic: true, size: 11 };
      hoja.getRow(2).height = 24;
      const filaCabecera = 4;
      const filaTitulos = hoja.getRow(filaCabecera);
      encabezados.forEach((texto, indice) => {
        const celda = filaTitulos.getCell(indice + 1);
        celda.value = texto;
        celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF315B86' } };
        celda.alignment = { vertical: 'middle', wrapText: true };
      });
      filaTitulos.height = 30;
      const seguro = (valor: unknown): string => {
        const texto = String(valor ?? '');
        return /^[\s]*[=+@-]/.test(texto) ? "'" + texto : texto;
      };
      this.recursosOrdenados.forEach((r, indice) => {
        const fila = hoja.getRow(filaCabecera + 1 + indice);
        const valores: (string | number)[] = [
          r.idRecursoDocumental ?? '', seguro(r.isbn), seguro(r.titulo), seguro(r.autor),
          seguro(r.tipo), seguro(r.editorial?.nombre), seguro(r.edicion),
          r.anio ?? '', seguro(r.formato === 'ELECTRONICO' ? 'Electrónico' : (r.formato === 'FISICO' ? 'Físico' : '')), seguro(r.urlRecurso), r.cantidad, seguro(r.movimiento),
          r.enCatalogoBiblioFca ? 'Sí' : 'No', seguro(r.observaciones),
          seguro((r.vinculacionesAcademicas ?? []).map(v =>
            `${v.programaEducativo?.nombre ?? ''} / ${v.academia?.nombre ?? ''} / ${v.experienciaEducativa?.nombre ?? ''}`
          ).join(' | '))
        ];
        valores.forEach((valor, col) => {
          const celda = fila.getCell(col + 1);
          celda.value = valor;
          celda.alignment = { vertical: 'middle', wrapText: true };
          celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: indice % 2 === 0 ? 'FFE8F0F9' : 'FFFFFFFF' } };
          celda.border = { bottom: { style: 'hair', color: { argb: 'FFDCE5EF' } } };
        });
        fila.getCell(2).numFmt = '@';
        fila.height = 32;
      });
      hoja.autoFilter = { from: { row: filaCabecera, column: 1 }, to: { row: filaCabecera + this.recursosOrdenados.length, column: encabezados.length } };
      hoja.views = [{ state: 'frozen', ySplit: filaCabecera }];
      hoja.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
      const buffer = await libro.xlsx.writeBuffer();
      const archivo = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `recursos_biblioteca_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar recursos a Excel:', error);
      this.mensajeError = 'No fue posible generar el archivo Excel.';
      this.cdr.markForCheck();
    }
  }

  cerrarFormulario(): void {
    if (this.guardando) return;
    this.mostrarFormulario = false;
    this.mensajeFormulario = '';
  }

  cambiarModoEditorial(modo: 'existente' | 'nueva'): void {
    this.modoEditorial = modo;
    this.idEditorialSeleccionada = null;
    this.nombreNuevaEditorial = '';
  }

  cambiarPrograma(): void {
    this.idAcademiaSeleccionada = null;
    this.idExperienciaSeleccionada = null;
  }

  cambiarAcademia(): void {
    this.idExperienciaSeleccionada = null;
  }

  get academiasDisponibles(): Academia[] {
    if (this.idProgramaSeleccionado == null) return [];
    return this.academias.filter(a =>
      (a.programasEducativos ?? []).some(p => p.idProgramaEducativo === this.idProgramaSeleccionado)
    );
  }

  get experienciasDisponibles(): ExperienciaEducativa[] {
    if (this.idAcademiaSeleccionada == null) return [];
    return this.experienciasEducativas.filter(e =>
      (e.academias ?? []).some(a => a.idAcademia === this.idAcademiaSeleccionada)
    );
  }

  agregarVinculacion(): void {
    const idProgramaEducativo = this.idProgramaSeleccionado;
    const idAcademia = this.idAcademiaSeleccionada;
    const idExperienciaEducativa = this.idExperienciaSeleccionada;
    if (idProgramaEducativo == null || idAcademia == null || idExperienciaEducativa == null) {
      this.mensajeFormulario = 'Selecciona un programa, una academia y una experiencia educativa.';
      return;
    }
    if (!this.academiasDisponibles.some(a => a.idAcademia === idAcademia)
      || !this.experienciasDisponibles.some(e => e.idExperienciaEducativa === idExperienciaEducativa)) {
      this.mensajeFormulario = 'La combinación académica seleccionada no es válida.';
      return;
    }
    if (this.vinculacionesSeleccionadas.some(v =>
      v.idProgramaEducativo === idProgramaEducativo &&
      v.idAcademia === idAcademia &&
      v.idExperienciaEducativa === idExperienciaEducativa)) {
      this.mensajeFormulario = 'Esta vinculación ya fue agregada.';
      return;
    }
    this.vinculacionesSeleccionadas.push({ idProgramaEducativo, idAcademia, idExperienciaEducativa });
    this.idProgramaSeleccionado = null;
    this.idAcademiaSeleccionada = null;
    this.idExperienciaSeleccionada = null;
    this.mensajeFormulario = '';
  }

  quitarVinculacion(indice: number): void {
    this.vinculacionesSeleccionadas.splice(indice, 1);
  }

  nombrePrograma(id: number): string {
    const p = this.programasEducativos.find(x => x.idProgramaEducativo === id);
    return p ? `${p.nombreCorto || p.nombre} — Plan ${p.anio}` : `Programa ${id}`;
  }

  nombreAcademia(id: number): string {
    return this.academias.find(x => x.idAcademia === id)?.nombre ?? `Academia ${id}`;
  }

  nombreExperiencia(id: number): string {
    return this.experienciasEducativas.find(x => x.idExperienciaEducativa === id)?.nombre ?? `Experiencia ${id}`;
  }

  cambiarFormato(formato: string | null): void {
    if (formato !== 'ELECTRONICO') {
      this.nuevoRecurso.urlRecurso = null;
    }
  }

  urlHttpValida(url: string | null | undefined): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url.trim());
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !!parsed.hostname;
    } catch {
      return false;
    }
  }

  guardarNuevoRecurso(): void {
    this.mensajeFormulario = '';
    if (!this.nuevoRecurso.titulo.trim()) {
      this.mensajeFormulario = 'El título es obligatorio.';
      return;
    }
    if (!this.nuevoRecurso.tipo?.trim()) {
      this.mensajeFormulario = 'El tipo de recurso es obligatorio.';
      return;
    }
    if (this.nuevoRecurso.formato !== 'FISICO' && this.nuevoRecurso.formato !== 'ELECTRONICO') {
      this.mensajeFormulario = 'Selecciona si el recurso es físico o electrónico.';
      return;
    }
    if (this.nuevoRecurso.formato === 'ELECTRONICO' && !this.urlHttpValida(this.nuevoRecurso.urlRecurso)) {
      this.mensajeFormulario = 'Para un recurso electrónico, escribe una URL válida que comience por https:// o http://.';
      return;
    }
    const cantidad = Number(this.nuevoRecurso.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      this.mensajeFormulario = 'La cantidad debe ser un número entero mayor a cero.';
      return;
    }
    if (this.cargandoCatalogos || this.mensajeCatalogos) {
      this.mensajeFormulario = 'Es necesario cargar los catálogos antes de guardar.';
      return;
    }
    if (this.modoEditorial === 'nueva' && !this.nombreNuevaEditorial.trim()) {
      this.mensajeFormulario = 'Escribe el nombre de la nueva editorial.';
      return;
    }
    if (this.modoFormulario === 'nuevo' && this.vinculacionesSeleccionadas.length === 0) {
      this.mensajeFormulario = 'Agrega al menos una vinculación académica.';
      return;
    }
    const request: RecursoRegistroRequestDTO = {
      titulo: this.nuevoRecurso.titulo.trim(),
      autor: this.nuevoRecurso.autor?.trim() || null,
      edicion: this.nuevoRecurso.edicion?.trim() || null,
      anio: this.nuevoRecurso.anio?.trim() || null,
      isbn: this.nuevoRecurso.isbn?.trim() || null,
      cantidad,
      movimiento: this.nuevoRecurso.movimiento,
      enCatalogoBiblioFca: this.nuevoRecurso.enCatalogoBiblioFca,
      observaciones: this.nuevoRecurso.observaciones?.trim() || null,
      tipo: this.nuevoRecurso.tipo.trim(),
      idEditorial: this.modoEditorial === 'existente' ? this.idEditorialSeleccionada : null,
      nuevaEditorial: this.modoEditorial === 'nueva' ? this.nombreNuevaEditorial.trim() : null,
      formato: this.nuevoRecurso.formato ?? 'FISICO',
      urlRecurso: this.nuevoRecurso.formato === 'ELECTRONICO'
        ? (this.nuevoRecurso.urlRecurso?.trim() || null)
        : null,
      vinculacionesAcademicas: this.vinculacionesSeleccionadas.map(v => ({ ...v }))
    };
    this.guardando = true;
    this.cdr.markForCheck();
    const operacion: Observable<unknown> = this.modoFormulario === 'editar' && this.idRecursoEditando != null
      ? this.recursoService.actualizarCompleto(this.idRecursoEditando, request)
      : this.recursoService.registrarConVinculaciones(request);
    operacion.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.nuevoRecurso = this.crearRecursoVacio();
        this.vinculacionesSeleccionadas = [];
        this.mensajeExito = this.modoFormulario === 'editar' ? 'Recurso actualizado correctamente.' : 'Recurso registrado correctamente.';
        this.cargarRecursos();
        this.cargarCatalogos();
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Error al registrar recurso:', error);
        this.guardando = false;
        this.mensajeFormulario = error.status === 401 ? 'Tu sesión ha expirado.'
          : error.status === 403 ? 'No tienes permisos para registrar recursos.'
            : error.status === 0 ? 'No fue posible conectar con el servidor.'
              : error.error?.detail || error.error?.message || 'No fue posible guardar el recurso. Verifica las vinculaciones.';
        this.cdr.markForCheck();
      }
    });
  }

  obtenerEditorial(recurso: RecursoDocumental): string {
    return recurso.editorial?.nombre || 'Sin editorial';
  }

  obtenerCatalogo(recurso: RecursoDocumental): string {
    return recurso.enCatalogoBiblioFca ? 'Sí' : 'No';
  }

  tieneVinculacionesNuevas(recurso: RecursoDocumental): boolean {
    return (recurso.vinculacionesAcademicas?.length ?? 0) > 0;
  }

  tieneVinculacionesAcademicas(recurso: RecursoDocumental): boolean {
    return this.tieneVinculacionesNuevas(recurso)
      || (recurso.experienciasEducativas?.length ?? 0) > 0;
  }

  tieneAcademias(academias: unknown[] | undefined): boolean {
    return (academias?.length ?? 0) > 0;
  }

  tieneProgramas(programas: unknown[] | undefined): boolean {
    return (programas?.length ?? 0) > 0;
  }

  compararEditoriales(editorial1: Editorial | null, editorial2: Editorial | null): boolean {
    return editorial1?.idEditorial === editorial2?.idEditorial;
  }
}
