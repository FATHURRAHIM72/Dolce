import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { ToastComponent } from '../../components/toast/toast.component'; // ✅ your toast
import { ViewChild } from '@angular/core';


@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css']
})
export class OrderConfirmationComponent implements OnInit, OnDestroy {
  tableNumber: string = '';
  orderId: number = 0;
  order: any = null;
  loading = false;
  error = '';
  refreshSub!: Subscription;
  confirmCancelVisible: boolean = false;


  @ViewChild(ToastComponent) toastRef!: ToastComponent;


  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.tableNumber = params['table'] || '';
      const orderIdParam = params['order'] || '';
  
      if (this.tableNumber && orderIdParam) {
        this.orderId = +orderIdParam; // ✅ save it for reuse
        this.fetchOrder(+this.tableNumber, this.orderId);
        this.refreshSub = interval(5000).subscribe(() =>
          this.fetchOrder(+this.tableNumber, this.orderId)
        );
      }
    });
  }  

  ngOnDestroy(): void {
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }

  fetchOrder(table: number, orderId: number): void {
    this.loading = true;
  
    this.http.get<any[]>('http://192.168.100.26:5000/api/orders/public').subscribe({
      next: (orders) => {
        const found = orders.find(
          o => +o.table_number === table && +o.id === orderId
        );
  
        if (found && found.status !== 'cancelled') {
          this.order = found;
          this.error = '';
        } else {
          this.order = null;
          this.error = 'No active order found for this table and order ID.';
        }
  
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to fetch order.';
        this.loading = false;
      }
    });
  }
  

  getStatusLabel(status: string): string {
    switch (status) {
      case 'preparing': return '🧑‍🍳 Preparing';
      case 'ready': return '✅ Ready for pickup';
      case 'served': return '🍽️ Served';
      case 'cancelled': return '❌ Order Cancelled';
      default: return '🕒 Pending';
    }
  }

  getTotal(): number {
    return this.order?.items?.reduce((sum: number, item: any) => sum + +item.subtotal, 0) || 0;
  }

  cancelOrder(): void {
    if (!this.order?.id) return;
  
    this.confirmCancelVisible = true;

  
    this.http.put(`http://192.168.100.26:5000/api/orders/${this.order.id}/cancel`, {}).subscribe({
      next: () => {
        this.toastRef.trigger('❌ Order cancelled successfully!');
        this.fetchOrder(+this.tableNumber, this.orderId); // refresh the order to show updated status
      },
      error: (err) => {
        this.toastRef.trigger(err?.error?.error || '❌ Failed to cancel the order.');
      }
    });
  }   

  confirmCancelOrder(): void {
    if (!this.order?.id) return;
  
    this.http.put(`http://192.168.100.26:5000/api/orders/${this.order.id}/cancel`, {}).subscribe({
      next: () => {
        this.toastRef.trigger('❌ Order cancelled successfully!');
        this.confirmCancelVisible = false;
        this.fetchOrder(+this.tableNumber, this.orderId); // ✅ pass table + orderId
      },
      error: (err) => {
        this.toastRef.trigger(err?.error?.error || '❌ Failed to cancel the order.');
        this.confirmCancelVisible = false;
      }
    });
  }
  
  
  
}
