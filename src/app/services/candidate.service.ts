import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CandidateService {
  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/users/me`);
  }

  getMyDemande(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/demandes/me`);
  }

  getMyBooking(): Observable<any> {
  return this.http.get<any>(`${environment.apiUrl}/bookings/me`);
}

  getMyOrders(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/orders/me`);
  }
  getMyNotifications(): Observable<any> {
  return this.http.get<any>(`${environment.apiUrl}/notifications/me`);
}

markNotificationAsRead(id: string): Observable<any> {
  return this.http.patch<any>(`${environment.apiUrl}/notifications/${id}/read`, {});
}

markAllNotificationsAsRead(): Observable<any> {
  return this.http.patch<any>(`${environment.apiUrl}/notifications/read-all`, {});
}

deleteNotification(id: string): Observable<any> {
  return this.http.delete<any>(`${environment.apiUrl}/notifications/${id}`);
}
}