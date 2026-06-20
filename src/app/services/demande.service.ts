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

 getAll(page: number, limit: number, filters: any = {}): Observable<any> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString());

  Object.keys(filters).forEach(key => {
    const val = filters[key];
    // Exclure null, undefined, string vide
    if (val !== null && val !== undefined && val !== '') {
      params = params.set(key, val.toString());
    }
  });

return this.http.get(this.apiUrl, { params });
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
  update(id: string, data: any): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/${id}`, data);
}
createAsAdmin(data: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/admin`, data);
}
}