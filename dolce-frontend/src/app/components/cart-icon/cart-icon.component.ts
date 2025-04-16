import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart-icon',
  templateUrl: './cart-icon.component.html',
  styleUrls: ['./cart-icon.component.css'],
  standalone: true
})
export class CartIconComponent implements OnInit {
  itemCount: number = 0;

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit(): void {
    this.itemCount = this.cartService.getItemCount();
    // Optionally update badge dynamically (if items can change outside this component)
    window.addEventListener('storage', () => {
      this.itemCount = this.cartService.getItemCount();
    });
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}
