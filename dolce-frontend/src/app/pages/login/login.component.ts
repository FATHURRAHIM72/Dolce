import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  login(): void {
    const data = { email: this.email, password: this.password };

    this.http.post<any>('http://192.168.100.26:5000/api/auth/login', data).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('role', res.role);

        // Redirect based on role
        if (res.role === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else if (res.role === 'staff') {
          this.router.navigate(['/staff-dashboard']);
        } else {
          this.error = 'Unauthorized role.';
        }
      },
      error: (err) => {
        console.error(err);
        this.error = err.error?.error || 'Login failed';
      }
    });
  }
}
