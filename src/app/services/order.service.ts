import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order } from '../models/order.model';
import { ApiResponse, PagedResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, limit = 10, status?: string): Observable<PagedResponse<Order>> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResponse<Order>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: string, status: string): Observable<ApiResponse<Order>> {
    return this.http.patch<ApiResponse<Order>>(
      `${this.apiUrl}/${id}/status`,
      { status }
    );
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}