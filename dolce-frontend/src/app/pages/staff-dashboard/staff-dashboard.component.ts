import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { ToastComponent } from '../../components/toast/toast.component';
import { jwtDecode } from 'jwt-decode';


interface DecodedToken {
  id: number;
  name: string;
  role: string;
}


@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './staff-dashboard.component.html',
  styleUrls: ['./staff-dashboard.component.css']
})
export class StaffDashboardComponent implements OnInit {
  orders: any[] = [];
  loading = false;
  activeTab: 'active' | 'history' = 'active';
  orderHistory: any[] = [];
  filterTable: string = '';
  filterOrderId: string = '';
  filterDate: string = '';
  filterTime: string = '';
  userName: string = '';
  selectedOrder: any = null;


  constructor(private orderService: OrderService, private http: HttpClient) {}

  ngOnInit(): void {
    this.decodeTokenAndFetchUser();
    this.fetchActiveOrders();
    this.fetchOrderHistory();
  }
  
  fetchActiveOrders(): void {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    this.http.get<any[]>('http://localhost:5000/api/orders', { headers }).subscribe({
      next: (data) => {
        // ✅ Only include active (not cancelled) orders
        const activeStatuses = ['pending', 'preparing', 'ready'];
        this.orders = data.filter(order => activeStatuses.includes(order.status));
      },
      error: (err) => console.error(err)
    });
  }
  

  fetchOrderHistory(): void {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    this.http.get<any[]>('http://localhost:5000/api/orders/history', { headers }).subscribe({
      next: (data) => {
        // ✅ Show only served and cancelled
        this.orderHistory = data.filter(order => order.status === 'served' || order.status === 'cancelled');
      },
      error: (err) => console.error(err)
    });
  }
  

  filteredOrderHistory(): any[] {
    return this.orderHistory.filter(order => {
      const tableMatch = this.filterTable
        ? order.table_number.toString().includes(this.filterTable.trim())
        : true;
  
      const orderIdMatch = this.filterOrderId
        ? order.id.toString().includes(this.filterOrderId.trim())
        : true;
  
      const dateMatch = this.filterDate
        ? new Date(order.created_at).toISOString().split('T')[0] === this.filterDate
        : true;
  
      const timeMatch = this.filterTime
        ? new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).includes(this.filterTime)
        : true;
  
      return tableMatch && orderIdMatch && dateMatch && timeMatch;
    });
  }
  

  fetchOrders(): void {
    this.loading = true;
    this.orderService.getActiveOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching orders', err);
        this.loading = false;
      }
    });
  }

  updateStatus(orderId: number, newStatus: string): void {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
  
    this.http.put(`http://localhost:5000/api/orders/${orderId}/status`, { status: newStatus }, { headers })
      .subscribe({
        next: () => {
          // 👇 FIX: Auto refresh both lists!
          this.fetchActiveOrders();
          this.fetchOrderHistory();
        },
        error: (err) => console.error(err)
      });
  }  

  formatStatus(status: string): string {
    switch (status) {
      case 'pending': return '🕒 Pending';
      case 'preparing': return '👨‍🍳 Preparing';
      case 'ready': return '✅ Ready';
      case 'served': return '🍽️ Served';
      case 'cancelled': return '❌ Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }
  

  openOrderModal(order: any): void {
    this.selectedOrder = order;
  }
  
  closeOrderModal(): void {
    this.selectedOrder = null;
  }

  logout(): void {
    localStorage.removeItem('token');
    window.location.href = '/login'; // redirect to login
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

  resetFilters(): void {
    this.filterTable = '';
    this.filterOrderId = '';
    this.filterDate = '';
    this.filterTime = '';
  }
  
  
}
