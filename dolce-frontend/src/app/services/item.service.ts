import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private apiUrl = `${environment.apiUrl}/items`;

  constructor(private http: HttpClient) {}

  // Fetch all available menu items
  getAllItems(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Fetch options for a specific item (used in item modal)
  getItemOptions(itemId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${itemId}/itemoptions`);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }
  
  getImageUrl(item: any): string {
    return item.image ? `http://localhost:5000${item.image}` : 'https://static.vecteezy.com/system/resources/previews/027/145/821/original/iced-coffee-with-cream-milk-perfect-for-drink-catalog-ai-generated-png.png';
  }
  
}
