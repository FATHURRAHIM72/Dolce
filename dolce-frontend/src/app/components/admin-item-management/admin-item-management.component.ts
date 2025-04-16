import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastComponent } from '../../components/toast/toast.component';

@Component({
  selector: 'app-admin-item-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './admin-item-management.component.html',
  styleUrls: ['./admin-item-management.component.css']
})
export class AdminItemManagementComponent implements OnInit {
  items: any[] = [];
  showModal = false;
  editingItem = false;
  selectedImage: File | null = null;
  previewUrl: string | ArrayBuffer | null = '';

  filterText = '';
  showDeleteModal = false;
  selectedDeleteId: number | null = null;
  selectedDeleteName: string = '';

  

  itemFormData = {
    id: null,
    name: '',
    price: '',
    category: 'Drinks',
    availability: 1,
    description: ''
  };

  @ViewChild(ToastComponent) toastRef!: ToastComponent;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchItems();
  }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
      // Don't manually add 'Content-Type' when using FormData
    });
  }
  

  fetchItems(): void {
    this.http.get<any[]>('http://localhost:5000/api/items').subscribe({
      next: (data) => this.items = data,
      error: (err) => console.error(err)
    });
  }

  openAddModal(): void {
    this.editingItem = false;
    this.previewUrl = '';
    this.itemFormData = {
      id: null,
      name: '',
      price: '',
      category: 'Drinks',
      availability: 1,
      description: ''
    };
    this.selectedImage = null;
    this.showModal = true;
  }

  openEditModal(item: any): void {
    this.editingItem = true;
    this.itemFormData = { ...item };
    this.previewUrl = item.image ? 'http://localhost:5000' + item.image : '';
    this.selectedImage = null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0] as File | null;
    this.selectedImage = file;
  
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }  

  saveItem(): void {
    const formData = new FormData();
    formData.append('name', this.itemFormData.name);
    formData.append('price', this.itemFormData.price);
    formData.append('category', this.itemFormData.category);
    formData.append('availability', this.itemFormData.availability.toString());
    formData.append('description', this.itemFormData.description);
    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }

    const url = this.editingItem
      ? `http://localhost:5000/api/items/${this.itemFormData.id}`
      : 'http://localhost:5000/api/items';

    const headers = this.getAuthHeaders();

    // ⚠️ Don't manually set Content-Type when using FormData
    const httpCall = this.editingItem
    ? this.http.put(url, formData, { headers: this.getAuthHeaders() })
    : this.http.post(url, formData, { headers: this.getAuthHeaders() });


    httpCall.subscribe({
      next: () => {
        this.fetchItems();
        this.toastRef.trigger(`✅ Item ${this.editingItem ? 'updated' : 'added'} successfully!`);
        this.closeModal();
      },
      error: (err) => {
        console.error(err);
        this.toastRef.trigger('❌ Failed to save item.');
      }
    });
  }

  confirmDelete(itemId: number): void {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const headers = this.getAuthHeaders();
    this.http.delete(`http://localhost:5000/api/items/${itemId}`, { headers }).subscribe({
      next: () => {
        this.fetchItems();
        this.toastRef.trigger('🗑️ Item deleted successfully!');
      },
      error: (err) => {
        console.error(err);
        this.toastRef.trigger('❌ Failed to delete item.');
      }
    });
  }

  filteredItems(): any[] {
    const text = this.filterText.toLowerCase();
    return this.items.filter(item =>
      item.name.toLowerCase().includes(text) ||
      item.category.toLowerCase().includes(text)
    );
  }

  openDeleteModal(item: any): void {
    this.selectedDeleteId = item.id;
    this.selectedDeleteName = item.name;
    this.showDeleteModal = true;
  }
  
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedDeleteId = null;
    this.selectedDeleteName = '';
  }
  
  confirmDeleteItem(): void {
    if (!this.selectedDeleteId) return;
    const headers = this.getAuthHeaders();
    this.http.delete(`http://localhost:5000/api/items/${this.selectedDeleteId}`, { headers }).subscribe({
      next: () => {
        this.fetchItems();
        this.toastRef.trigger('🗑️ Item deleted successfully!');
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error(err);
        this.toastRef.trigger('❌ Failed to delete item.');
      }
    });
  }
  
  
}
