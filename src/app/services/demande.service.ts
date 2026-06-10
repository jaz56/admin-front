import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Demande } from '../models/demande.model';
import { ApiResponse, PagedResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class DemandeService {
  private apiUrl = `${environment.apiUrl}/demandes`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, limit = 10, status?: string): Observable<PagedResponse<Demande>> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResponse<Demande>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<Demande>> {
    return this.http.get<ApiResponse<Demande>>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: string, status: string): Observable<ApiResponse<Demande>> {
    return this.http.patch<ApiResponse<Demande>>(
      `${this.apiUrl}/${id}/status`,
      { status }
    );
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}