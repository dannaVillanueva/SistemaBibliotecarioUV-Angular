import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AdministracionCatalogosService, AcademiaCatalogo, EditorialCatalogo,
  ExperienciaCatalogo, ProgramaCatalogo, RegistroCatalogo, SeccionCatalogo
} from '../../core/services/administracion-catalogos.service';

type FormularioCatalogo = {
  nombre: string;
  nombreCorto: string;
  anio: string;
  modalidad: string;
  descripcion: string;
  estado: boolean;
  paginaWeb: string;
  idsProgramas: number[];
  idsAcademias: number[];
};

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalogos.html',
  styleUrl: './catalogos.scss'
})
export class Catalogos implements OnInit {
  private readonly api = inject(AdministracionCatalogosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly secciones: { id: SeccionCatalogo; nombre: string; icono: string }[] = [
    { id: 'programas', nombre: 'Programas educativos', icono: '🎓' },
    { id: 'academias', nombre: 'Academias', icono: '🏛️' },
    { id: 'experiencias', nombre: 'Experiencias educativas', icono: '📖' },
    { id: 'editoriales', nombre: 'Editoriales', icono: '📚' }
  ];

  seccion: SeccionCatalogo = 'programas';
  programas: ProgramaCatalogo[] = [];
  academias: AcademiaCatalogo[] = [];
  experiencias: ExperienciaCatalogo[] = [];
  editoriales: EditorialCatalogo[] = [];
  busqueda = '';
  cargando = false;
  guardando = false;
  error = '';
  aviso = '';
  formularioAbierto = false;
  editandoId: number | null = null;
  formulario: FormularioCatalogo = this.formularioVacio();
  readonly aniosDisponibles = Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => String(new Date().getFullYear() - i));
  modalidadPersonalizada = '';
  readonly modalidades = ['Escolarizada', 'Virtual', 'Abierta', 'Otra'];

  nombreProgramaCompleto(programa: Pick<ProgramaCatalogo, 'nombre' | 'anio' | 'modalidad'>): string {
    return [programa.nombre, programa.anio, programa.modalidad].filter(Boolean).join(' - ');
  }

  get vistaPreviaPrograma(): string {
    return [this.formulario.nombre, this.formulario.anio, this.formulario.modalidad === 'Otra' ? this.modalidadPersonalizada : this.formulario.modalidad].filter(Boolean).join(' - ');
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const valor = params.get('seccion') ?? params.get('tipo');
      if (this.esSeccion(valor)) this.seccion = valor;
      this.busqueda = '';
      this.cdr.markForCheck();
    });
    this.cargarTodo();
  }

  private esSeccion(valor: string | null): valor is SeccionCatalogo {
    return valor === 'programas' || valor === 'academias' || valor === 'experiencias' || valor === 'editoriales';
  }

  seleccionarSeccion(seccion: SeccionCatalogo): void {
    this.cerrarFormulario();
    this.seccion = seccion;
    this.busqueda = '';
    void this.router.navigate(['/catalogos'], { queryParams: { seccion } });
  }

  cargarTodo(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.markForCheck();
    forkJoin({
      programas: this.api.listar<ProgramaCatalogo>('programas'),
      academias: this.api.listar<AcademiaCatalogo>('academias'),
      experiencias: this.api.listar<ExperienciaCatalogo>('experiencias'),
      editoriales: this.api.listar<EditorialCatalogo>('editoriales')
    }).subscribe({
      next: datos => {
        this.programas = datos.programas;
        this.academias = datos.academias;
        this.experiencias = datos.experiencias;
        this.editoriales = datos.editoriales;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Error al consultar catálogos:', err);
        this.error = err.status === 403 ? 'No tienes permisos para consultar los catálogos.' :
          err.status === 401 ? 'La sesión ha expirado. Vuelve a iniciar sesión.' :
          'No fue posible cargar los catálogos. Comprueba la conexión con Spring Boot.';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  get tituloActual(): string {
    return this.secciones.find(item => item.id === this.seccion)?.nombre ?? 'Catálogos';
  }

  get registros(): RegistroCatalogo[] {
    const datos: Record<SeccionCatalogo, RegistroCatalogo[]> = {
      programas: this.programas, academias: this.academias,
      experiencias: this.experiencias, editoriales: this.editoriales
    };
    const termino = this.busqueda.trim().toLocaleLowerCase();
    return datos[this.seccion].filter(item =>
      !termino || item.nombre.toLocaleLowerCase().includes(termino)
    );
  }

  obtenerId(registro: RegistroCatalogo): number {
    if ('idProgramaEducativo' in registro) return registro.idProgramaEducativo;
    if ('idAcademia' in registro) return registro.idAcademia;
    if ('idExperienciaEducativa' in registro) return registro.idExperienciaEducativa;
    return registro.idEditorial;
  }

  detalle(registro: RegistroCatalogo): string {
    if ('idProgramaEducativo' in registro) return [registro.nombreCorto, registro.anio, registro.modalidad].filter(Boolean).join(' · ') || 'Sin datos adicionales';
    if ('idAcademia' in registro) return `${registro.programasEducativos?.length ?? 0} programa(s) educativo(s)`;
    if ('idExperienciaEducativa' in registro) return `${registro.estado ? 'Activa' : 'Inactiva'} · ${registro.academias?.length ?? 0} academia(s)`;
    return registro.paginaWeb || 'Sin página web';
  }

  formularioVacio(): FormularioCatalogo {
    return { nombre: '', nombreCorto: '', anio: '', modalidad: '', descripcion: '', estado: true, paginaWeb: '', idsProgramas: [], idsAcademias: [] };
  }

  nuevo(): void {
    this.formulario = this.formularioVacio();
    this.modalidadPersonalizada = '';
    this.editandoId = null;
    this.error = '';
    this.aviso = '';
    this.formularioAbierto = true;
  }

  editar(registro: RegistroCatalogo): void {
    this.nuevo();
    this.editandoId = this.obtenerId(registro);
    this.formulario.nombre = registro.nombre;
    if ('idProgramaEducativo' in registro) {
      this.formulario.nombreCorto = registro.nombreCorto ?? '';
      this.formulario.anio = registro.anio ?? '';
      this.formulario.modalidad = registro.modalidad && this.modalidades.includes(registro.modalidad) ? registro.modalidad : (registro.modalidad ? 'Otra' : '');
      this.modalidadPersonalizada = this.formulario.modalidad === 'Otra' ? (registro.modalidad ?? '') : '';
    } else if ('idAcademia' in registro) {
      this.formulario.idsProgramas = (registro.programasEducativos ?? []).map(p => p.idProgramaEducativo);
    } else if ('idExperienciaEducativa' in registro) {
      this.formulario.descripcion = registro.descripcion ?? '';
      this.formulario.estado = registro.estado;
      this.formulario.idsAcademias = (registro.academias ?? []).map(a => a.idAcademia);
    } else {
      this.formulario.paginaWeb = registro.paginaWeb ?? '';
    }
  }

  cerrarFormulario(): void {
    if (this.guardando) return;
    this.formularioAbierto = false;
    this.editandoId = null;
  }

  seleccionado(tipo: 'programas' | 'academias', id: number): boolean {
    return (tipo === 'programas' ? this.formulario.idsProgramas : this.formulario.idsAcademias).includes(id);
  }

  cambiarSeleccion(tipo: 'programas' | 'academias', id: number, activo: boolean): void {
    const clave = tipo === 'programas' ? 'idsProgramas' : 'idsAcademias';
    const ids = this.formulario[clave];
    this.formulario[clave] = activo ? [...new Set([...ids, id])] : ids.filter(x => x !== id);
  }

  private datosParaGuardar(): object {
    const nombre = this.formulario.nombre.trim();
    switch (this.seccion) {
      case 'programas':
        return { nombre, nombreCorto: this.formulario.nombreCorto.trim() || null, anio: this.formulario.anio.trim() || null, modalidad: (this.formulario.modalidad === 'Otra' ? this.modalidadPersonalizada.trim() : this.formulario.modalidad.trim()) || null };
      case 'academias':
        return { nombre, programasEducativos: this.programas.filter(p => this.formulario.idsProgramas.includes(p.idProgramaEducativo)) };
      case 'experiencias':
        return { nombre, descripcion: this.formulario.descripcion.trim() || null, estado: this.formulario.estado,
          academias: this.academias.filter(a => this.formulario.idsAcademias.includes(a.idAcademia)).map(a => ({ idAcademia: a.idAcademia })) };
      case 'editoriales':
        return { nombre, paginaWeb: this.formulario.paginaWeb.trim() || null };
    }
  }

  guardar(): void {
    if (this.guardando) return;
    if (!this.formulario.nombre.trim()) {
      this.error = 'El nombre es obligatorio.';
      return;
    }
    if (this.seccion === 'programas' && (!this.formulario.anio || !this.formulario.modalidad.trim() || (this.formulario.modalidad === 'Otra' && !this.modalidadPersonalizada.trim()))) {
      this.error = 'Selecciona el año del plan de estudios y la modalidad.';
      return;
    }
    this.guardando = true;
    this.error = '';
    const editando = this.editandoId !== null;
    const peticion = editando
      ? this.api.actualizar<RegistroCatalogo>(this.seccion, this.editandoId!, this.datosParaGuardar())
      : this.api.crear<RegistroCatalogo>(this.seccion, this.datosParaGuardar());
    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.formularioAbierto = false;
        this.editandoId = null;
        this.aviso = editando ? 'Registro actualizado correctamente.' : 'Registro creado correctamente.';
        this.cargarTodo();
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Error al guardar catálogo:', err);
        this.error = err.status === 403 ? 'No tienes permisos para guardar.' :
          err.status === 409 ? 'El registro ya existe o presenta un conflicto.' :
          'No se pudo guardar. Revisa los datos y las relaciones seleccionadas.';
        this.guardando = false;
        this.cdr.markForCheck();
      }
    });
  }

  eliminar(registro: RegistroCatalogo): void {
    if (!window.confirm(`¿Deseas eliminar "${registro.nombre}"? Esta acción no se puede deshacer.`)) return;
    this.error = '';
    this.api.eliminar(this.seccion, this.obtenerId(registro)).subscribe({
      next: () => {
        this.aviso = 'Registro eliminado correctamente.';
        this.cargarTodo();
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Error al eliminar catálogo:', err);
        this.error = err.status === 403 ? 'No tienes permisos para eliminar este registro.' :
          'No se pudo eliminar. Es posible que esté relacionado con otros registros o recursos documentales.';
        this.cdr.markForCheck();
      }
    });
  }
}
