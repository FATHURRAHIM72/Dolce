import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastComponent } from '../../components/toast/toast.component';

@Component({
  selector: 'app-admin-order-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './admin-order-management.component.html',
  styleUrls: ['./admin-order-management.component.css']
})
export class AdminOrderManagementComponent implements OnInit {
  orders: any[] = [];
  orderHistory: any[] = [];
  pendingPayments: any[] = [];
  loading = false;
  activeTab: 'active' | 'history' | 'payments' = 'active';

  selectedOrder: any = null;
  filterTable = '';
  filterOrderId = '';
  filterDate = '';
  filterTime = '';

  @ViewChild(ToastComponent) toastRef!: ToastComponent;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchActiveOrders();
    this.fetchOrderHistory();
    this.fetchPendingPayments();
  }

  fetchActiveOrders(): void {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
  
    this.loading = true;
    this.http.get<any[]>('http://localhost:5000/api/orders', { headers }).subscribe({
      next: (data) => {
        // ✅ Filter only active statuses
        const activeStatuses = ['pending', 'preparing', 'ready'];
        const filtered = data.filter(order => activeStatuses.includes(order.status));
        this.orders = this.normalizeOrders(filtered);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching active orders', err);
        this.loading = false;
      }
    });
  }
  

  fetchOrderHistory(): void {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
  
    this.http.get<any[]>('http://localhost:5000/api/orders/history', { headers }).subscribe({
      next: (data) => {
        // ✅ Only include orders with status served or cancelled
        const filtered = data.filter(order =>
          order.status === 'served' || order.status === 'cancelled'
        );
        this.orderHistory = this.normalizeOrders(filtered);
      },
      error: (err) => console.error('Error fetching order history', err)
    });
  }
  

  fetchPendingPayments(): void {
    this.http.get<any[]>('http://localhost:5000/api/orders/pending-payments').subscribe({
      next: (data) => {
        // ✅ Filter out cancelled orders
        const filtered = data.filter(order => order.status !== 'cancelled');
        this.pendingPayments = this.normalizeOrders(filtered);
      },
      error: (err) => console.error('Error fetching pending payments', err)
    });
  }
  

  normalizeOrders(data: any[]): any[] {
    return data.map(order => ({
      ...order,
      items: order.items.map((item: any) => ({
        name: item.name || item.item_name,
        quantity: item.quantity,
        options: item.options,
        price: parseFloat(item.price) || 0,
        subtotal: parseFloat(item.subtotal) || (parseFloat(item.price) || 0) * item.quantity
      }))
    }));
  }

  confirmPayment(orderId: number): void {
    this.http.put(`http://localhost:5000/api/orders/${orderId}/confirm-payment`, {}).subscribe({
      next: () => {
        this.toastRef.trigger('✅ Payment confirmed!');
        this.fetchPendingPayments();
      },
      error: (err) => {
        console.error('Error confirming payment', err);
        this.toastRef.trigger('❌ Failed to confirm payment.');
      }
    });
  }

  filteredOrderHistory(): any[] {
    return this.orderHistory.filter(order => {
      const tableMatch = this.filterTable ? order.table_number.toString().includes(this.filterTable.trim()) : true;
      const orderIdMatch = this.filterOrderId ? order.id.toString().includes(this.filterOrderId.trim()) : true;
      const dateMatch = this.filterDate ? new Date(order.created_at).toISOString().split('T')[0] === this.filterDate : true;
      const timeMatch = this.filterTime
        ? new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).includes(this.filterTime)
        : true;

      return tableMatch && orderIdMatch && dateMatch && timeMatch;
    });
  }

  openOrderModal(order: any): void {
    // Normalize items again in case modal opens from filtered list or pending payment
    const normalizedItems = order.items.map((item: any) => ({
      name: item.name || item.item_name,
      quantity: item.quantity,
      options: item.options,
      price: parseFloat(item.price) || 0,
      subtotal: parseFloat(item.subtotal) || (parseFloat(item.price) || 0) * item.quantity
    }));

    this.selectedOrder = {
      ...order,
      items: normalizedItems
    };
  }

  closeOrderModal(): void {
    this.selectedOrder = null;
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  resetFilters(): void {
    this.filterTable = '';
    this.filterOrderId = '';
    this.filterDate = '';
    this.filterTime = '';
  }

  calculateOrderTotal(items: any[]): number {
    return items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }
}
