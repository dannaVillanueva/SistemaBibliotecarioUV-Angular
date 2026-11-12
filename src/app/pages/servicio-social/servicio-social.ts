import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, finalize, timeout } from 'rxjs';

import {
  AlumnoPractica,
  AlumnoPracticaRequest
} from '../../models/alumno-practica.model';

import {
  RegistroHoras,
  RegistroHorasRequest,
  ResumenHoras
} from '../../models/registro-horas.model';

import { ProgramaEducativo } from '../../models/programa-educativo.model';

import { AlumnosPracticasService } from '../../core/services/alumnos-practicas.service';
import { RegistrosHorasService } from '../../core/services/registros-horas.service';
import { ProgramasEducativosService } from '../../core/services/programas-educativos.service';

@Component({
  selector: 'app-servicio-social',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './servicio-social.html',
  styleUrl: './servicio-social.scss'
})
export class ServicioSocial implements OnInit {

  private alumnosService = inject(AlumnosPracticasService);
  private horasService = inject(RegistrosHorasService);
  private programasService = inject(ProgramasEducativosService);
  private cdr = inject(ChangeDetectorRef);

  alumnos: AlumnoPractica[] = [];
  programas: ProgramaEducativo[] = [];
  registros: RegistroHoras[] = [];

  seleccionado: AlumnoPractica | null = null;
  resumen: ResumenHoras | null = null;

  busqueda = '';
  filtroEstado = 'TODOS';

  cargando = false;
  guardando = false;
  cargandoHistorial = false;

  mostrarFormulario = false;
  mostrarAsistencia = false;
  mostrarHistorial = false;

  idEditando: number | null = null;
  idRegistroEditando: number | null = null;
  idProgramaSeleccionado: number | null = null;

  mensaje = '';
  error = '';

  formulario: AlumnoPracticaRequest = this.nuevoAlumno();
  formularioHoras: RegistroHorasRequest = this.nuevoRegistro();

  ngOnInit(): void {
    this.cargarDatos();
  }

  private fechaLocal(): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private nuevoAlumno(): AlumnoPracticaRequest {
    return {
      matricula: '',
      nombre: '',
      apellidos: '',
      correo: '',
      telefono: '',
      tipo: 'SERVICIO_SOCIAL',
      fechaInicio: '',
      fechaFin: '',
      horasRequeridas: 480,
      activo: true,
      programaEducativo: {
        idProgramaEducativo: 0
      }
    };
  }

  private nuevoRegistro(): RegistroHorasRequest {
    return {
      idAlumno: 0,
      fecha: this.fechaLocal(),
      horaEntrada: '',
      horaSalida: '',
      observaciones: ''
    };
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.markForCheck();

    forkJoin({
      alumnos: this.alumnosService.buscarPorTipo('SERVICIO_SOCIAL'),
      programas: this.programasService.listar()
    }).pipe(
      timeout(15000),
      finalize(() => {
        this.cargando = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: ({ alumnos, programas }) => {
        this.alumnos = alumnos;
        this.programas = programas;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Error al cargar estudiantes:', err);
        this.error = this.obtenerError(err);
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  get alumnosFiltrados(): AlumnoPractica[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.alumnos.filter(alumno => {
      const nombre = (
        alumno.nombreCompleto ||
        `${alumno.nombre} ${alumno.apellidos}`
      ).toLowerCase();

      const matricula = alumno.matricula.toLowerCase();

      const coincideBusqueda =
        !texto ||
        nombre.includes(texto) ||
        matricula.includes(texto);

      const coincideEstado =
        this.filtroEstado === 'TODOS' ||
        (this.filtroEstado === 'ACTIVOS' && alumno.activo) ||
        (this.filtroEstado === 'INACTIVOS' && !alumno.activo);

      return coincideBusqueda && coincideEstado;
    });
  }

  get totalActivos(): number {
    return this.alumnos.filter(a => a.activo).length;
  }

  get totalInactivos(): number {
    return this.alumnos.filter(a => !a.activo).length;
  }

  get horasAcumuladas(): number {
    return this.alumnos.reduce(
      (total, a) => total + Number(a.horasRealizadas || 0),
      0
    );
  }

  abrirNuevo(): void {
    this.idEditando = null;
    this.formulario = this.nuevoAlumno();
    this.idProgramaSeleccionado = null;

    this.error = '';
    this.mensaje = '';

    this.mostrarAsistencia = false;
    this.mostrarHistorial = false;
    this.mostrarFormulario = true;
  }

  editarAlumno(alumno: AlumnoPractica): void {
    this.idEditando = alumno.idAlumno;

    this.formulario = {
      matricula: alumno.matricula,
      nombre: alumno.nombre,
      apellidos: alumno.apellidos,
      correo: alumno.correo || '',
      telefono: alumno.telefono || '',
      tipo: 'SERVICIO_SOCIAL',
      fechaInicio: alumno.fechaInicio,
      fechaFin: alumno.fechaFin,
      horasRequeridas: alumno.horasRequeridas,
      activo: alumno.activo,
      programaEducativo: {
        idProgramaEducativo: alumno.idProgramaEducativo
      }
    };

    this.idProgramaSeleccionado = alumno.idProgramaEducativo;

    this.error = '';
    this.mensaje = '';

    this.mostrarAsistencia = false;
    this.mostrarHistorial = false;
    this.mostrarFormulario = true;
  }

  guardarAlumno(): void {
    if (this.guardando) return;

    if (
      !this.formulario.matricula.trim() ||
      !this.formulario.nombre.trim() ||
      !this.formulario.apellidos.trim() ||
      !this.formulario.fechaInicio ||
      !this.formulario.fechaFin ||
      !this.idProgramaSeleccionado ||
      this.formulario.horasRequeridas <= 0
    ) {
      this.error = 'Completa los campos obligatorios.';
      return;
    }

    if (this.formulario.fechaFin < this.formulario.fechaInicio) {
      this.error = 'La fecha final no puede ser anterior a la inicial.';
      return;
    }

    const datos: AlumnoPracticaRequest = {
      ...this.formulario,
      tipo: 'SERVICIO_SOCIAL',
      programaEducativo: {
        idProgramaEducativo: Number(this.idProgramaSeleccionado)
      }
    };

    this.guardando = true;
    this.error = '';

    const editando = this.idEditando !== null;

    const peticion = editando
      ? this.alumnosService.actualizar(this.idEditando!, datos)
      : this.alumnosService.guardar(datos);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;

        this.mensaje = editando
          ? 'Estudiante actualizado correctamente.'
          : 'Estudiante registrado correctamente.';

        this.cargarDatos();
        this.cdr.markForCheck();
      },
      error: err => {
        this.guardando = false;
        this.error = this.obtenerError(err);
        this.cdr.markForCheck();
      }
    });
  }

  finalizarAlumno(alumno: AlumnoPractica): void {
    if (!confirm(
      `¿Finalizar el servicio social de ${alumno.nombreCompleto}?`
    )) {
      return;
    }

    this.alumnosService.finalizar(alumno.idAlumno).subscribe({
      next: () => {
        this.mensaje = 'Servicio social finalizado.';
        this.cargarDatos();
        this.cdr.markForCheck();
      },
      error: err => {
        this.error = this.obtenerError(err);
        this.cdr.markForCheck();
      }
    });
  }

  reactivarAlumno(alumno: AlumnoPractica): void {
    this.alumnosService.reactivar(alumno.idAlumno).subscribe({
      next: () => {
        this.mensaje = 'Estudiante reactivado.';
        this.cargarDatos();
        this.cdr.markForCheck();
      },
      error: err => {
        this.error = this.obtenerError(err);
        this.cdr.markForCheck();
      }
    });
  }

  abrirAsistencia(alumno: AlumnoPractica): void {
    this.seleccionado = alumno;
    this.idRegistroEditando = null;

    this.formularioHoras = {
      ...this.nuevoRegistro(),
      idAlumno: alumno.idAlumno
    };

    this.error = '';

    this.mostrarFormulario = false;
    this.mostrarHistorial = false;
    this.mostrarAsistencia = true;
  }

  guardarAsistencia(): void {
    if (!this.seleccionado || this.guardando) return;

    const datos: RegistroHorasRequest = {
      ...this.formularioHoras,
      idAlumno: this.seleccionado.idAlumno
    };

    if (!datos.fecha || !datos.horaEntrada || !datos.horaSalida) {
      this.error = 'Completa fecha, entrada y salida.';
      return;
    }

    if (datos.horaEntrada >= datos.horaSalida) {
      this.error = 'La salida debe ser posterior a la entrada.';
      return;
    }

    this.guardando = true;
    this.error = '';

    const editando = this.idRegistroEditando !== null;

    const peticion = editando
      ? this.horasService.actualizar(this.idRegistroEditando!, datos)
      : this.horasService.registrar(datos);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarAsistencia = false;

        this.mensaje = editando
          ? 'Asistencia actualizada.'
          : 'Asistencia registrada.';

        this.cargarDatos();
        this.cdr.markForCheck();
      },
      error: err => {
        this.guardando = false;
        this.error = this.obtenerError(err);
        this.cdr.markForCheck();
      }
    });
  }

  verHistorial(alumno: AlumnoPractica): void {
    this.seleccionado = alumno;
    this.registros = [];
    this.resumen = null;
    this.error = '';

    this.mostrarFormulario = false;
    this.mostrarAsistencia = false;
    this.mostrarHistorial = true;

    this.cargarHistorial(alumno.idAlumno);
  }

  private cargarHistorial(idAlumno: number): void {
    this.cargandoHistorial = true;

    forkJoin({
      registros: this.horasService.historial(idAlumno),
      resumen: this.horasService.resumen(idAlumno)
    }).pipe(timeout(15000)).subscribe({
      next: ({ registros, resumen }) => {
        this.registros = [...registros].sort((a, b) =>
          `${b.fecha} ${b.horaEntrada}`.localeCompare(
            `${a.fecha} ${a.horaEntrada}`
          )
        );

        this.resumen = resumen;
        this.cargandoHistorial = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.error = this.obtenerError(err);
        this.cargandoHistorial = false;
        this.cdr.markForCheck();
      }
    });
  }

  editarAsistencia(registro: RegistroHoras): void {
    this.idRegistroEditando = registro.idRegistro;

    this.formularioHoras = {
      idAlumno: registro.idAlumno,
      fecha: registro.fecha,
      horaEntrada: registro.horaEntrada.slice(0, 5),
      horaSalida: registro.horaSalida.slice(0, 5),
      observaciones: registro.observaciones || ''
    };

    this.error = '';
    this.mostrarAsistencia = true;
  }

  cerrarFormulario(): void {
    if (this.guardando) return;

    this.mostrarFormulario = false;
    this.error = '';
  }

  cerrarAsistencia(): void {
    if (this.guardando) return;

    this.mostrarAsistencia = false;
    this.error = '';
  }

  cerrarHistorial(): void {
    this.mostrarHistorial = false;
    this.error = '';
  }

  private obtenerError(err: any): string {
    if (err?.name === 'TimeoutError') {
      return 'El servidor tardó demasiado en responder.';
    }
    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error;
    }

    return (
      err?.error?.message ||
      err?.message ||
      'Ocurrió un error al procesar la solicitud.'
    );
  }
}
