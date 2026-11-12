import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Academia,
  Editorial,
  ExperienciaEducativa,
  ProgramaEducativo
} from '../../models/recurso.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {

  constructor(
    private http: HttpClient
  ) {}

  listarEditoriales(): Observable<Editorial[]> {
    return this.http.get<Editorial[]>(
      '/api/editoriales'
    );
  }

  listarExperiencias(): Observable<ExperienciaEducativa[]> {
    return this.http.get<ExperienciaEducativa[]>(
      '/api/experiencias'
    );
  }

  listarAcademias(): Observable<Academia[]> {
    return this.http.get<Academia[]>(
      '/api/academias'
    );
  }

  listarProgramas(): Observable<ProgramaEducativo[]> {
    return this.http.get<ProgramaEducativo[]>(
      '/api/programas'
    );
  }
}
