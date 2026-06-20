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

  getAll(page: number = 0, limit: number = 10): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}`, {
    params: { page: page.toString(), limit: limit.toString() }
  });
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

  delete(id: string): Observable<any> {
  return this.http.delete<any>(`${this.apiUrl}/${id}`);
}
  updateScore(id: string, score: number) {
    // Le backend attend un @RequestParam, on l'envoie donc via 'params'
    return this.http.patch(`${this.apiUrl}/${id}/score`, {}, {
      params: { score: score.toString() }
    });
  }
  createAsAdmin(data: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/admin`, data);
}
update(id: string, payload: any): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
}
}