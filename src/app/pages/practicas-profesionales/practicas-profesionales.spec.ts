import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PracticasProfesionales } from './practicas-profesionales';

describe('PracticasProfesionales', () => {
  let component: PracticasProfesionales;
  let fixture: ComponentFixture<PracticasProfesionales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PracticasProfesionales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PracticasProfesionales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
