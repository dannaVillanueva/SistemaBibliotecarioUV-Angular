import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Descartes } from './descartes';

describe('Descartes', () => {
  let component: Descartes;
  let fixture: ComponentFixture<Descartes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Descartes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Descartes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
