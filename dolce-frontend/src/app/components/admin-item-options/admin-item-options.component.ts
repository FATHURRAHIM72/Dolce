import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastComponent } from '../../components/toast/toast.component';

@Component({
  selector: 'app-admin-item-options',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './admin-item-options.component.html',
  styleUrls: ['./admin-item-options.component.css']
})
export class AdminItemOptionsComponent implements OnInit {
  optionsList: any[] = [];
  items: any[] = [];

  showModal = false;
  editing = false;

  showDeleteModal = false;
  selectedDeleteId: number | null = null;
  selectedDeleteName = '';

  filterText: string = '';

  optionFormData = {
    id: null,
    item_id: '',
    name: '',
    price: '',
    availability: 1
  };
  

  @ViewChild(ToastComponent) toastRef!: ToastComponent;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchOptions();
    this.fetchItems();
  }

  fetchOptions(): void {
    this.http.get<any[]>('http://localhost:5000/api/items/item-options').subscribe({
      next: data => {
        this.optionsList = data;
        console.log('Fetched options:', data); // ✅ Log the response
      },
      error: err => console.error(err)
    });
  }

  fetchItems(): void {
    this.http.get<any[]>('http://localhost:5000/api/items').subscribe({
      next: data => this.items = data,
      error: err => console.error(err)
    });
  }

  openAddModal(): void {
    this.editing = false;
    this.optionFormData = {
      id: null,
    item_id: '',
    name: '',
    price: '',
    availability: 1
    };
    this.showModal = true;
  }

  openEditModal(option: any): void {
    this.editing = true;
    this.optionFormData = { ...option };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveOption(): void {
    const url = this.editing
      ? `http://localhost:5000/api/items/item-options/${this.optionFormData.id}`
      : 'http://localhost:5000/api/items/item-options';

    const method = this.editing ? 'put' : 'post';

    this.http[method](url, this.optionFormData).subscribe({
      next: () => {
        this.toastRef.trigger(`✅ Option ${this.editing ? 'updated' : 'added'} successfully!`);
        this.fetchOptions();
        this.closeModal();
      },
      error: err => {
        console.error(err);
        this.toastRef.trigger('❌ Failed to save option.');
      }
    });
  }

  deleteOption(id: number): void {
    if (!confirm('Are you sure you want to delete this option?')) return;

    this.http.delete(`http://localhost:5000/api/items/item-options/${id}`).subscribe({
      next: () => {
        this.toastRef.trigger('🗑️ Option deleted!');
        this.fetchOptions();
      },
      error: err => {
        console.error(err);
        this.toastRef.trigger('❌ Failed to delete option.');
      }
    });
  }

  getItemName(id: number): string {
    return this.items.find(x => x.id === id)?.name || 'Unknown';
  }  

  openDeleteModal(option: any): void {
    this.selectedDeleteId = option.id;
    this.selectedDeleteName = option.name;
    this.showDeleteModal = true;
  }
  
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedDeleteId = null;
    this.selectedDeleteName = '';
  }
  
  confirmDelete(): void {
    if (!this.selectedDeleteId) return;
  
    this.http.delete(`http://localhost:5000/api/items/item-options/${this.selectedDeleteId}`).subscribe({
      next: () => {
        this.toastRef.trigger('🗑️ Option deleted!');
        this.fetchOptions();
        this.closeDeleteModal();
      },
      error: err => {
        console.error(err);
        this.toastRef.trigger('❌ Failed to delete option.');
      }
    });
  }

  get filteredOptions() {
    return this.optionsList.filter(opt => {
      const itemName = this.getItemName(opt.item_id).toLowerCase();
      const optionName = opt.name.toLowerCase();
      return itemName.includes(this.filterText.toLowerCase()) || optionName.includes(this.filterText.toLowerCase());
    });
  }
  
  
  
}
