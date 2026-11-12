import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Usuario, UsuarioFormulario, UsuariosService } from '../../core/services/usuarios.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export class Usuarios implements OnInit {
  private service = inject(UsuariosService);
  private cdr = inject(ChangeDetectorRef);
  usuarios: Usuario[] = [];
  busqueda = '';
  filtroEstado = 'TODOS';
  cargando = false;
  guardando = false;
  modal = false;
  editando: number | null = null;
  error = '';
  mensaje = '';
  formulario: UsuarioFormulario = this.vacio();

  ngOnInit(): void { this.cargar(); }
  private vacio(): UsuarioFormulario {
    return { nombre: '', correo: '', password: '', rol: 'PERSONAL_BIBLIOTECA' };
  }
  get filtrados(): Usuario[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.usuarios.filter(u =>
      (!q || `${u.nombre} ${u.correo}`.toLowerCase().includes(q)) &&
      (this.filtroEstado === 'TODOS' || (this.filtroEstado === 'ACTIVOS' ? u.activo : !u.activo))
    );
  }
  get activos(): number { return this.usuarios.filter(u => u.activo).length; }
  get inactivos(): number { return this.usuarios.filter(u => !u.activo).length; }
  get responsables(): number { return this.usuarios.filter(u => u.rol === 'RESPONSABLE_BIBLIOTECA').length; }
  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.service.listar().pipe(finalize(() => { this.cargando = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: data => { this.usuarios = data; this.cdr.markForCheck(); },
        error: err => { this.error = this.errorHttp(err); this.cdr.markForCheck(); }
      });
  }
  nuevo(): void { this.editando = null; this.formulario = this.vacio(); this.error = ''; this.modal = true; }
  editar(u: Usuario): void {
    this.editando = u.idUsuario;
    this.formulario = { nombre: u.nombre, correo: u.correo, password: '', rol: u.rol };
    this.error = '';
    this.modal = true;
  }
  cerrar(): void { if (!this.guardando) { this.modal = false; this.error = ''; } }
  guardar(): void {
    if (this.guardando) return;
    if (!this.formulario.nombre.trim() || !this.formulario.correo.trim()) {
      this.error = 'Completa el nombre y el correo.'; return;
    }
    if (this.editando === null && this.formulario.password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.'; return;
    }
    if (this.formulario.password && this.formulario.password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.'; return;
    }
    this.guardando = true;
    this.error = '';
    const editando = this.editando !== null;
    const peticion = editando
      ? this.service.editar(this.editando!, this.formulario)
      : this.service.crear(this.formulario);
    peticion.pipe(finalize(() => { this.guardando = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.modal = false;
          this.mensaje = editando ? 'Usuario actualizado correctamente.' : 'Usuario registrado correctamente.';
          this.cargar();
        },
        error: err => { this.error = this.errorHttp(err); this.cdr.markForCheck(); }
      });
  }
  cambiarEstado(u: Usuario): void {
    const accion = u.activo ? 'desactivar' : 'reactivar';
    if (!confirm(`¿Deseas ${accion} a ${u.nombre}?`)) return;
    this.error = '';
    this.service.estado(u.idUsuario, !u.activo).subscribe({
      next: () => { this.mensaje = 'Estado actualizado correctamente.'; this.cargar(); },
      error: err => { this.error = this.errorHttp(err); this.cdr.markForCheck(); }
    });
  }
  private errorHttp(err: any): string {
    if (err?.status === 0) return 'No se pudo conectar con el servidor.';
    if (err?.status === 403) return 'No tienes permisos para administrar usuarios.';
    if (err?.status === 409) return err?.error?.detail || err?.error?.message || 'El correo ya existe o la operación no está permitida.';
    return err?.error?.detail || err?.error?.message || 'No se pudo completar la operación.';
  }
}
