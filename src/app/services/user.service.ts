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

 getAll(
  page: number, limit: number,
  role?: string, search?: string, status?: string,
  sexe?: string, pays?: string, nationalite?: string, fonction?: string,
  numeroTel?: string, codePostal?: string, jobFavori?: string
): Observable<any> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString());

  if (role)        params = params.set('role', role);
  if (search)      params = params.set('search', search);
  if (status)      params = params.set('status', status);
  if (sexe)        params = params.set('sexe', sexe);
  if (pays)        params = params.set('pays', pays);
  if (nationalite) params = params.set('nationalite', nationalite);
  if (fonction)    params = params.set('fonction', fonction);
  if (numeroTel)   params = params.set('numeroTel', numeroTel);
  if (codePostal)  params = params.set('codePostal', codePostal);
  if (jobFavori)   params = params.set('jobFavori', jobFavori);

  return this.http.get<any>(this.apiUrl, { params });
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
  createUser(data: any): Observable<any> {
return this.http.post(this.apiUrl, data);
}
uploadFile(id: string, type: string, file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  return this.http.post<any>(`${this.apiUrl}/${id}/upload`, formData);
}
createAsAdmin(data: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/admin`, data);
}
}