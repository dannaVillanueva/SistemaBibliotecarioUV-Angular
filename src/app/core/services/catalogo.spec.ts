
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CatalogoService } from './catalogo';

describe('CatalogoService', () => {
  let service: CatalogoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CatalogoService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(CatalogoService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });
});
