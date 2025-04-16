import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { HttpClient } from '@angular/common/http';
import { ViewChild } from '@angular/core';
import { ToastComponent } from '../../components/toast/toast.component';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';



@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  totalPrice: number = 0;
  tableNumber: string = '';
  isTableEditable: boolean = true;
  paymentMethod: string = 'counter'; // default
  redirecting: boolean = false;

  @ViewChild(ToastComponent) toastRef!: ToastComponent;

  constructor(
    private cartService: CartService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cartItems = this.cartService.getCartItems();
    this.calculateTotal();
  
    // ✅ Get saved table number and source from localStorage
    const savedTable = localStorage.getItem('tableNumber');
    const tableSource = localStorage.getItem('tableSource');
  
    if (savedTable) {
      this.tableNumber = savedTable;
      this.isTableEditable = tableSource !== 'qr'; // 🔒 uneditable if from QR
    } else {
      this.isTableEditable = true; // editable if nothing found
    }
  }
  
  
  calculateTotal(): void {
    this.totalPrice = this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }  
  
  updateQuantity(item: any, amount: number): void {
    item.quantity += amount;
    if (item.quantity <= 0) {
      this.removeItem(item);
    }
    this.cartService.saveCart(this.cartItems);
    this.calculateTotal();
  }

  removeItem(item: any): void {
    this.cartItems = this.cartItems.filter(i =>
      !(i.id === item.id && i.options === item.options)
    );
    this.cartService.saveCart(this.cartItems);
    this.calculateTotal();
  }

  checkout(): void {
    if (!this.tableNumber.trim()) {
      alert('❗ Table number is missing. Please scan QR code again.');
      return;
    }
  
    const orderData = {
      tableNumber: this.tableNumber,
      paymentMethod: this.paymentMethod,
      items: this.cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        options: item.options || '',
        subtotal: item.subtotal || item.price * item.quantity
      }))
    };
  
    this.http.post('http://192.168.100.26:5000/api/orders', orderData).subscribe({
      next: (response: any) => {
        const newOrderId = response.insertId;
        this.toastRef.trigger('✅ Order placed! Redirecting...');
        this.cartService.clearCart();
        this.cartItems = [];
        this.totalPrice = 0;
        this.redirecting = true;
    
        setTimeout(() => {
          this.router.navigate(['/order-confirmation'], {
            queryParams: {
              table: this.tableNumber,
              order: newOrderId // ✅ use order ID for precise redirection
            }
          });
        }, 1500);
      },
      error: (err) => {
        console.error(err);
        alert('❌ Failed to place order.');
      }
    });    
  }  
  
}
