import { Component, OnInit } from '@angular/core'; // ✅ Add OnInit
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { HttpClient } from '@angular/common/http';

interface DecodedToken {
  id: number;
  name: string;
  role: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  userName: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.decodeTokenAndFetchUser(); // ✅ You need to call it here!
  }

  decodeTokenAndFetchUser(): void {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token) as DecodedToken;
      const userId = decoded.id;

      this.http.get<any>(`http://localhost:5000/api/auth/${userId}`).subscribe({
        next: (user) => {
          this.userName = user.name;
        },
        error: (err) => {
          console.error('Failed to fetch user info', err);
        }
      });
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.href = '/login';
  }
}
