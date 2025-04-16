import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminItemManagementComponent } from './admin-item-management.component';

describe('AdminItemManagementComponent', () => {
  let component: AdminItemManagementComponent;
  let fixture: ComponentFixture<AdminItemManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminItemManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminItemManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
