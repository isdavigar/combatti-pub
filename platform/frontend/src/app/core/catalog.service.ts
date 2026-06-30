import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Category {
  id: number;
  name: string;
  displayOrder: number;
  active: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stockManaged: boolean;
  minStock: number;
  active: boolean;
  categoryId: number;
  categoryName: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/catalog`;

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  getProducts(categoryId?: number): Observable<Product[]> {
    let params = new HttpParams();
    if (categoryId != null) {
      params = params.set('categoryId', String(categoryId));
    }
    return this.http.get<Product[]>(`${this.baseUrl}/products`, { params });
  }
}
