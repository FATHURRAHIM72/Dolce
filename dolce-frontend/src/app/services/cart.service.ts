import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartKey = 'dolce_cart';
  private cartItems: any[] = [];

  constructor() {
    const saved = localStorage.getItem(this.cartKey);
    this.cartItems = saved ? JSON.parse(saved) : [];
  }

  // Get all items
  getCartItems(): any[] {
    return this.cartItems;
  }

  // Save to localStorage
  saveCart(items: any[]): void {
    this.cartItems = items;
    localStorage.setItem(this.cartKey, JSON.stringify(this.cartItems));
  }

  // Add item to cart
  addToCart(item: any): void {
    const cart = this.getCartItems();
    
    const existing = cart.find(i =>
      i.id === item.id &&
      i.options === item.options // include options in comparison
    );
  
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push(item);
    }
  
    this.saveCart(cart);
  }
  

  // Remove item
  removeItem(itemId: number): void {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    this.saveCart(this.cartItems);
  }

  // Clear entire cart
  clearCart(): void {
    this.cartItems = [];
    localStorage.removeItem(this.cartKey);
  }

  // Get total items count (e.g. for cart icon)
  getItemCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }
}
