
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { finalize, timeout } from 'rxjs';

import {
  AlumnoPractica
} from '../../models/alumno-practica.model';

import {
  RegistroHoras,
  RegistroHorasRequest,
  ResumenHoras
} from '../../models/registro-horas.model';

import {
  AlumnosPracticasService
} from '../../core/services/alumnos-practicas.service';

import {
  RegistrosHorasService
} from '../../core/services/registros-horas.service';

@Component({
  selector: 'app-control-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './control-asistencia.html',
  styleUrl: './control-asistencia.scss'
})
export class ControlAsistencia implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alumnosService = inject(AlumnosPracticasService);
  private horasService = inject(RegistrosHorasService);
  private cdr = inject(ChangeDetectorRef);

  get esPracticasProfesionales(): boolean {
    return this.router.url.includes('/practicas-profesionales/asistencia/');
  }

  get nombreModulo(): string {
    return this.esPracticasProfesionales
      ? 'Prácticas Profesionales'
      : 'Servicio Social';
  }

  get rutaRegreso(): string {
    return this.esPracticasProfesionales
      ? '/servicio-practicas/practicas-profesionales'
      : '/servicio-practicas/servicio-social';
  }

  idAlumno = 0;

  alumno: AlumnoPractica | null = null;
  resumen: ResumenHoras | null = null;
  registros: RegistroHoras[] = [];

  cargandoAlumno = false;
  cargandoResumen = false;
  cargandoHistorial = false;
  guardando = false;

  error = '';
  mensaje = '';

  fechaSeleccionada = this.fechaHoy();
  filtroDesde = '';
  filtroHasta = '';

  idRegistroEditando: number | null = null;

  formulario: RegistroHorasRequest = {
    idAlumno: 0,
    fecha: this.fechaHoy(),
    horaEntrada: '',
    horaSalida: '',
    observaciones: ''
  };

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('idAlumno')
    );

    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'El identificador del estudiante no es válido.';
      return;
    }

    this.idAlumno = id;
    this.formulario.idAlumno = id;

    this.cargarDatos();
  }

  private fechaHoy(): string {
    return this.formatearFecha(new Date());
  }

  private formatearFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private convertirFecha(valor: string): Date {
    const [anio, mes, dia] = valor.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  }

  private convertirHoras(valor: unknown): number {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
  }

  cargarDatos(): void {
    this.error = '';

    this.cargarAlumno();
    this.cargarResumen();
    this.cargarHistorial();
  }

  private cargarAlumno(): void {
    this.cargandoAlumno = true;

    this.alumnosService.buscarPorId(this.idAlumno)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.cargandoAlumno = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: alumno => {
          this.alumno = alumno;
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('Error al consultar alumno:', err);
          this.error = 'No se pudo cargar el estudiante. ' +
            this.obtenerError(err);
          this.cdr.markForCheck();
        }
      });
  }

  private cargarResumen(): void {
    this.cargandoResumen = true;

    this.horasService.resumen(this.idAlumno)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.cargandoResumen = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: resumen => {
          this.resumen = resumen;
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('Error al consultar resumen:', err);
          this.resumen = null;
          this.cdr.markForCheck();
        }
      });
  }

  private cargarHistorial(): void {
    this.cargandoHistorial = true;

    this.horasService.historial(this.idAlumno)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.cargandoHistorial = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: registros => {
          this.registros = [...registros].sort(
            (a, b) =>
              `${b.fecha} ${b.horaEntrada}`.localeCompare(
                `${a.fecha} ${a.horaEntrada}`
              )
          );

          this.cdr.markForCheck();
        },
        error: err => {
          console.error('Error al consultar historial:', err);
          this.error =
            'No se pudo cargar el historial de asistencias. ' +
            this.obtenerError(err);
          this.cdr.markForCheck();
        }
      });
  }

  get cargando(): boolean {
    return this.cargandoAlumno ||
      this.cargandoResumen ||
      this.cargandoHistorial;
  }

  get horasDia(): number {
    return this.registros
      .filter(r => r.fecha === this.fechaSeleccionada)
      .reduce(
        (total, r) =>
          total + this.convertirHoras(r.horasRealizadas),
        0
      );
  }

  get horasSemana(): number {
    if (!this.fechaSeleccionada) return 0;

    const fecha = this.convertirFecha(this.fechaSeleccionada);

    const diferenciaLunes = (fecha.getDay() + 6) % 7;

    const lunes = new Date(fecha);
    lunes.setDate(lunes.getDate() - diferenciaLunes);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    const inicio = this.formatearFecha(lunes);
    const fin = this.formatearFecha(domingo);

    return this.registros
      .filter(r => r.fecha >= inicio && r.fecha <= fin)
      .reduce(
        (total, r) =>
          total + this.convertirHoras(r.horasRealizadas),
        0
      );
  }

  get horasMes(): number {
    if (!this.fechaSeleccionada) return 0;

    const mes = this.fechaSeleccionada.substring(0, 7);

    return this.registros
      .filter(r => r.fecha.startsWith(mes))
      .reduce(
        (total, r) =>
          total + this.convertirHoras(r.horasRealizadas),
        0
      );
  }

  get horasAcumuladas(): number {
    if (this.resumen) {
      return this.convertirHoras(
        this.resumen.horasRealizadas
      );
    }

    if (!this.cargandoHistorial) {
      return this.registros.reduce(
        (total, r) =>
          total + this.convertirHoras(r.horasRealizadas),
        0
      );
    }

    return this.convertirHoras(
      this.alumno?.horasRealizadas
    );
  }

  get horasRequeridas(): number {
    return this.convertirHoras(
      this.resumen?.horasRequeridas ??
      this.alumno?.horasRequeridas
    );
  }

  get horasRestantes(): number {
    return Math.max(
      0,
      this.horasRequeridas - this.horasAcumuladas
    );
  }

  get porcentajeAvance(): number {
    if (this.horasRequeridas <= 0) return 0;

    return Math.min(
      100,
      (this.horasAcumuladas / this.horasRequeridas) * 100
    );
  }

  get horasFormulario(): number {
    const entrada = this.formulario.horaEntrada;
    const salida = this.formulario.horaSalida;

    if (!entrada || !salida) return 0;

    const [he, me] = entrada.split(':').map(Number);
    const [hs, ms] = salida.split(':').map(Number);

    const minutosEntrada = he * 60 + me;
    const minutosSalida = hs * 60 + ms;

    if (minutosSalida <= minutosEntrada) return 0;

    return (minutosSalida - minutosEntrada) / 60;
  }

  get registrosDelDia(): RegistroHoras[] {
    return this.registros.filter(
      r => r.fecha === this.fechaSeleccionada
    );
  }

  get registrosFiltrados(): RegistroHoras[] {
    return this.registros.filter(r => {
      if (this.filtroDesde && r.fecha < this.filtroDesde) {
        return false;
      }

      if (this.filtroHasta && r.fecha > this.filtroHasta) {
        return false;
      }

      return true;
    });
  }

  get horasFiltradas(): number {
    return this.registrosFiltrados.reduce(
      (total, r) =>
        total + this.convertirHoras(r.horasRealizadas),
      0
    );
  }

  nuevaAsistencia(): void {
    this.idRegistroEditando = null;

    this.formulario = {
      idAlumno: this.idAlumno,
      fecha: this.fechaSeleccionada || this.fechaHoy(),
      horaEntrada: '',
      horaSalida: '',
      observaciones: ''
    };

    this.error = '';
    this.cdr.markForCheck();
  }

  editarAsistencia(registro: RegistroHoras): void {
    this.idRegistroEditando = registro.idRegistro;

    this.formulario = {
      idAlumno: this.idAlumno,
      fecha: registro.fecha,
      horaEntrada: registro.horaEntrada.substring(0, 5),
      horaSalida: registro.horaSalida.substring(0, 5),
      observaciones: registro.observaciones || ''
    };

    this.error = '';
    this.cdr.markForCheck();

    document.getElementById('registro-asistencia')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
  }

  guardarAsistencia(): void {
    if (this.guardando) return;

    if (
      !this.formulario.fecha ||
      !this.formulario.horaEntrada ||
      !this.formulario.horaSalida
    ) {
      this.error = 'Completa la fecha y los horarios.';
      return;
    }

    if (this.horasFormulario <= 0) {
      this.error =
        'La hora de salida debe ser posterior a la entrada.';
      return;
    }

    if (!this.alumno?.activo) {
      this.error =
        'El estudiante está inactivo y no puede registrar horas.';
      return;
    }

    const datos: RegistroHorasRequest = {
      ...this.formulario,
      idAlumno: this.idAlumno
    };

    const editando = this.idRegistroEditando !== null;

    const peticion = editando
      ? this.horasService.actualizar(
        this.idRegistroEditando!,
        datos
      )
      : this.horasService.registrar(datos);

    this.guardando = true;
    this.error = '';
    this.mensaje = '';

    peticion
      .pipe(
        timeout(15000),
        finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.fechaSeleccionada = datos.fecha;

          this.nuevaAsistencia();

          this.mensaje = editando
            ? 'Asistencia actualizada correctamente.'
            : 'Asistencia registrada correctamente.';

          this.cargarResumen();
          this.cargarHistorial();

          this.cdr.markForCheck();
        },

        error: err => {
          console.error('Error al guardar asistencia:', err);

          this.error = this.obtenerError(err);
          this.cdr.markForCheck();
        }
      });
  }

  limpiarFiltros(): void {
    this.filtroDesde = '';
    this.filtroHasta = '';
  }

  private obtenerError(err: any): string {
    if (err?.name === 'TimeoutError') {
      return 'El servidor tardó demasiado en responder.';
    }

    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }

    if (typeof err?.error === 'string') {
      return err.error;
    }

    return (
      err?.error?.message ||
      err?.error?.detail ||
      err?.message ||
      'Ocurrió un error al procesar la solicitud.'
    );
  }
}
