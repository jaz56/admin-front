import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  totalUsers: number;
  totalDemandes: number;
  totalBookings: number;
  totalRevenue: number;
  demandesByStatus: { [key: string]: number };
  recentUsers: any[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http
      .get<any>(`${environment.apiUrl}/admin/stats`)
      .pipe(map((res) => res.data));
  }

  getRecentUsers(): Observable<any[]> {
    return this.http
      .get<any>(`${environment.apiUrl}/users?page=0&limit=5`)
      .pipe(map((res) => res.data || []));
  }
}