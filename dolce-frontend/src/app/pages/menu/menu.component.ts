import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemService } from '../../services/item.service';
import { CartService } from '../../services/cart.service';
import { ToastComponent } from '../../components/toast/toast.component';
import { CartIconComponent } from '../../components/cart-icon/cart-icon.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent, CartIconComponent],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  items: any[] = [];
  filteredItems: any[] = [];
  selectedCategory: string = 'All';
  categories: string[] = [
    'All', 
    'Dolce Signature',   
    'Flavoured Coffee',
    'Non Coffee', 
    'Pasta Series', 

  ];
  categoryIcons: { [key: string]: string } = {
    'All': 'bi-grid',
    'Dolce Signature': 'bi-stars',
    'Flavoured Coffee': 'bi-cup-straw',
    'Non Coffee': 'bi-droplet-half',
    'Pasta Series': 'bi-egg-fried'
  };
  
  
  tableNumber: string = '';
  loading: boolean = true;

  selectedItem: any = null;
  selectedOptions: any[] = [];
  modalVisible: boolean = false;
  calculatedTotal: number = 0;
  modalQuantity: number = 1;
  selectedQuantity: number = 1;

  selectedMilkOption: string = 'Regular';


  @ViewChild(ToastComponent) toastRef!: ToastComponent;

  constructor(
    private itemService: ItemService,
    private cartService: CartService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const table = params['table'];
      if (table) {
        this.tableNumber = table;
        localStorage.setItem('tableNumber', table);        
        localStorage.setItem('tableSource', 'qr');        
      }
    });
  
    this.fetchMenuItems();
  }
  

  fetchMenuItems(): void {
    this.loading = true;
    this.itemService.getAllItems().subscribe((data) => {
      this.items = data;
      this.applyFilter();
      this.loading = false;
    });
  }

  applyFilter(): void {
    const availableItems = this.items
      .filter(item => item.availability === 1)
      .sort((a, b) => a.id - b.id); // ascending order by ID
      
    if (this.selectedCategory === 'All') {
      this.filteredItems = availableItems;
    } else {
      this.filteredItems = availableItems.filter(
        item => item.category?.toLowerCase() === this.selectedCategory.toLowerCase()
      );
    }
  }
  
  

  openItemModal(item: any): void {
    this.selectedItem = item;
    this.selectedOptions = [];
    this.selectedQuantity = 1; // default qty
    this.selectedMilkOption = 'Regular'; // reset to default
    this.calculatedTotal = +item.price;
    this.modalVisible = true;
    this.modalQuantity = 1;
  
    this.itemService.getItemOptions(item.id).subscribe(options => {
      this.selectedItem.options = options;
    });
  }

  changeQuantity(amount: number): void {
    this.selectedQuantity += amount;
    if (this.selectedQuantity < 1) this.selectedQuantity = 1;
    this.recalculateTotal();
  }

  recalculateTotal(): void {
    const base = +this.selectedItem.price;
    const addons = this.selectedOptions.reduce((sum, opt) => sum + +opt.price, 0);
    const milkPrice = this.selectedMilkOption === 'Oat Milk' ? 2.5 : 0;
    this.calculatedTotal = (base + addons + milkPrice) * this.selectedQuantity;
  }  

  toggleOption(option: any): void {
    const index = this.selectedOptions.findIndex(o => o.id === option.id);
    if (index > -1) {
      this.selectedOptions.splice(index, 1);
    } else {
      this.selectedOptions.push(option);
    }
    this.recalculateTotal();
  }

  addToCartFromModal(): void {
    const itemToAdd = {
      id: this.selectedItem.id,
      name: this.selectedItem.name,
      price: +this.selectedItem.price + this.selectedOptions.reduce((sum, opt) => sum + +opt.price, 0) + (this.selectedMilkOption === 'Oat Milk' ? 2.5 : 0),
      quantity: this.selectedQuantity,
      options: [...this.selectedOptions.map(o => o.name), this.selectedMilkOption].join(', '),
      subtotal: this.calculatedTotal,
      image: this.selectedItem.image
    };
  
    this.cartService.addToCart(itemToAdd);
    this.toastRef.trigger('✅ Item added to cart!');
    this.modalVisible = false;
    window.dispatchEvent(new Event('storage'));
  }
  
  isDrinkCategory(category: string): boolean {
    const drinkCategories = [
      'Dolce Signature', 'Flavoured Coffee', 'Coffee Classic',
      'Non Coffee', 'Frappe', 'Mocktails & Refreshing', 'Smoothies', 'Berry Series'
    ];
    return drinkCategories.includes(category);
  }
  
}
