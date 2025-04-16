import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminItemOptionsComponent } from './admin-item-options.component';

describe('AdminItemOptionsComponent', () => {
  let component: AdminItemOptionsComponent;
  let fixture: ComponentFixture<AdminItemOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminItemOptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminItemOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
