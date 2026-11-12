import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicioPracticas } from './servicio-practicas';

describe('ServicioPracticas', () => {
  let component: ServicioPracticas;
  let fixture: ComponentFixture<ServicioPracticas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicioPracticas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicioPracticas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
