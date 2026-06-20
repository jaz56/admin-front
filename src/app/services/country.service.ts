import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Country } from '../models/country.model';
import { ApiResponse, PagedResponse } from '../models/api-response.model';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
@Injectable({ providedIn: 'root' })
export class CountryService {
  private apiUrl = `${environment.apiUrl}/countries`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, limit = 10): Observable<PagedResponse<Country>> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    return this.http.get<PagedResponse<Country>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<Country>> {
    return this.http.get<ApiResponse<Country>>(`${this.apiUrl}/${id}`);
  }

  update(id: string, data: Partial<Country>): Observable<ApiResponse<Country>> {
    return this.http.put<ApiResponse<Country>>(`${this.apiUrl}/${id}`, data);
  }

  toggleActive(id: string, isActive: boolean): Observable<ApiResponse<Country>> {
    return this.http.patch<ApiResponse<Country>>(
      `${this.apiUrl}/${id}/active`,
      { isActive }
    );
  }
  getActiveForSelect(): Observable<{ value: string; label: string }[]> {
  return this.http.get<{ value: string; label: string }[]>(
    `${this.apiUrl}/active`
  ).pipe(
    catchError(() => of([]))
  );
}
}