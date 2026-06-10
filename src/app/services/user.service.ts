import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { ApiResponse, PagedResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, limit = 10, role?: string): Observable<PagedResponse<User>> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    if (role) params = params.set('role', role);
    return this.http.get<PagedResponse<User>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`);
  }

  update(id: string, data: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  updateVerificationStatus(id: string, status: string): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(
      `${this.apiUrl}/${id}/verification`,
      { candidateVerificationStatus: status }
    );
  }
}