import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  type: string;
  userId: string;
  email: string;
  role: string;
  nom: string;
  prenom: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: JwtResponse;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.success) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        })
      );
  }

  // Redirection automatique selon le rôle
  redirectAfterLogin(): void {
    const user = this.getCurrentUser();
    if (user?.role === 'admin' || user?.role === 'ADMIN') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/candidate/dashboard']);
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/authentication/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): JwtResponse | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN' || user?.role === 'admin';
  }

  isCandidate(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'candidat' || user?.role === 'CANDIDAT';
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
  updateProfile(data: any): Observable<any> {
  return this.http.put<any>(`${environment.apiUrl}/users/profile`, data).pipe(
    tap((response) => {
      if (response.success) {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          const updated = {
            ...currentUser,
            nom: data.nom,
            prenom: data.prenom,
            email: data.email,
          };
          localStorage.setItem('user', JSON.stringify(updated));
        }
      }
    })
  );
}

updatePassword(payload: { currentPassword: string | null | undefined; newPassword: string | null | undefined }): Observable<any> {
  return this.http.put<any>(`${environment.apiUrl}/users/password`, payload);
}
}