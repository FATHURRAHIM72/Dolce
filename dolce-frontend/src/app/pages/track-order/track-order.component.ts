import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';



@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.css']
})
export class TrackOrderComponent implements OnDestroy {
  tableNumber: string = '';
  order: any = null;
  loading: boolean = false;
  error: string = '';
  refreshSub!: Subscription;
  trackBy: 'table' | 'orderId' = 'table';
  orderIdInput: string = '';


  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnDestroy(): void {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const table = params['table'];
      if (table) {
        this.tableNumber = table;
        this.trackOrder();
      }
    });
  }
  

  trackOrder(): void {
    this.loading = true;
    this.order = null;
    this.error = '';
  
    this.fetchOrder();
  
    if (this.refreshSub) this.refreshSub.unsubscribe();
    this.refreshSub = interval(5000).subscribe(() => {
      this.fetchOrder();
    });
  }
  
  
  fetchOrder(): void {
    this.http.get<any[]>('http://192.168.100.26:5000/api/orders/public').subscribe({
      next: (orders) => {
        let found;
        if (this.trackBy === 'table') {
          found = orders.find(o => +o.table_number === +this.tableNumber && o.status !== 'served');
        } else {
          found = orders.find(o => +o.id === +this.orderIdInput && o.status !== 'served');
        }
  
        if (found) {
          this.order = found;
          this.error = '';
        } else {
          this.order = null;
          this.error = this.trackBy === 'table'
            ? 'No active orders found for this table.'
            : 'Order ID not found or already served.';
        }
  
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to fetch order status.';
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
      default: return 'Pending';
    }
  }

  getElapsedTime(createdAt: string): string {
    const orderTime = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - orderTime.getTime();
    const mins = Math.floor(diffMs / 60000);
    return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  }

  isStatusReached(step: string): boolean {
    const orderStatus = this.order?.status;
    const order = ['pending', 'preparing', 'ready', 'served'];
    return order.indexOf(orderStatus) >= order.indexOf(step);
  }
  
  
}
