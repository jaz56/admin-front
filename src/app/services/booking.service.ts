import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Booking } from '../models/booking.model';
import { ApiResponse, PagedResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private apiUrl = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, limit = 10, status?: string): Observable<PagedResponse<Booking>> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResponse<Booking>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<Booking>> {
    return this.http.get<ApiResponse<Booking>>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: string, status: string): Observable<ApiResponse<Booking>> {
    return this.http.patch<ApiResponse<Booking>>(
      `${this.apiUrl}/${id}/status`,
      { status }
    );
  }

  updateInterviewStatus(id: string, data: {
    interviewStatus: string;
    interviewScore?: number;
    interviewCompleted?: boolean;
  }): Observable<ApiResponse<Booking>> {
    return this.http.patch<ApiResponse<Booking>>(
      `${this.apiUrl}/${id}/interview`,
      data
    );
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}