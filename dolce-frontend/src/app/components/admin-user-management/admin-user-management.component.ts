import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastComponent } from '../../components/toast/toast.component'; // ✅ Toast
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './admin-user-management.component.html',
  styleUrls: ['./admin-user-management.component.css']
})
export class AdminUserManagementComponent implements OnInit {

  userList: any[] = [];
  showUserModal = false;
  editingUser = false;
  users: any;

  showDeleteModal = false;
  selectedDeleteEmail: string = '';

  userFormData = {
    name: '',
    email: '',
    password: '',
    role: 'staff'
  };
  

  @ViewChild(ToastComponent) toastRef!: ToastComponent;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers(): void {
    this.http.get<any[]>('http://localhost:5000/api/users').subscribe({
      next: data => {
        // Filter to only include users with role 'staff'
        this.userList = data.filter(user => user.role === 'staff');
      },
      error: err => console.error(err)
    });
  }  

  openAddUserModal(): void {
    this.editingUser = false;
    this.userFormData = { name: '', email: '', password: '', role: 'staff' };
    this.showUserModal = true;
  }

  openEditUserModal(user: any): void {
    this.editingUser = true;
    this.userFormData = {
      name: user.name,
      email: user.email,
      password: '', // empty by default
      role: user.role
    };
    this.showUserModal = true;
  }  

  closeUserModal(): void {
    this.showUserModal = false;
  }

  saveUser(): void {
    const url = this.editingUser
      ? `http://localhost:5000/api/users/${this.userFormData.email}`
      : 'http://localhost:5000/api/users';

    const method = this.editingUser ? 'put' : 'post';

    this.http[method](url, this.userFormData).subscribe({
      next: () => {
        this.getUsers();
        this.toastRef.trigger(this.editingUser ? '✏️ User updated' : '✅ User added');
        this.closeUserModal();
      },
      error: err => this.toastRef.trigger('❌ Failed to save user: ' + (err.error?.error || err.message))
    });
  }

  deleteUser(email: string): void {
    if (!confirm('Are you sure you want to delete this user?')) return;

    this.http.delete(`http://localhost:5000/api/users/${email}`).subscribe({
      next: () => {
        this.getUsers();
        this.toastRef.trigger('🗑️ User deleted');
      },
      error: err => this.toastRef.trigger('❌ Failed to delete user: ' + (err.error?.error || err.message))
    });
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  // When trash icon clicked
  openDeleteModal(email: string): void {
    this.selectedDeleteEmail = email;
    this.showDeleteModal = true;
  }

  // Close without deleting
  closeDeleteModal(): void {
    this.selectedDeleteEmail = '';
    this.showDeleteModal = false;
  }

  // Confirm deletion
  confirmDeleteUser(): void {
    this.http.delete(`http://localhost:5000/api/users/${this.selectedDeleteEmail}`).subscribe({
      next: () => {
        this.toastRef.trigger('🗑️ User deleted');
        this.getUsers();
        this.closeDeleteModal();
      },
      error: err => this.toastRef.trigger('❌ Failed to delete user: ' + (err.error?.error || err.message))
    });
  }

  
  
}
