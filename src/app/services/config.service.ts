import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ConfigItem {
  id: string;
  category: string;
  value: string;
  label: string;
  icon?: string;
  color?: string; // "warning" | "success" | "danger" | "primary" | null
  order: number;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private cache = new Map<string, ConfigItem[]>();
private api    = `${environment.apiUrl}/config`;
private apiBase = environment.apiUrl; // ex: "http://localhost:8083/api"
private countriesApi = `${environment.apiUrl}/countries`;

  constructor(private http: HttpClient) {}

  get(category: string): Observable<ConfigItem[]> {
    if (this.cache.has(category)) return of(this.cache.get(category)!);
    return this.http.get<ConfigItem[]>(`${this.api}/${category}`).pipe(
      tap(items => this.cache.set(category, items)),
      catchError(() => of([]))
    );
  }

  getFonctions(): Observable<ConfigItem[]> { return this.get('fonction'); }
  getStatuts():   Observable<ConfigItem[]> { return this.get('statut_candidat'); }
  getSteps():     Observable<ConfigItem[]> { return this.get('progress_step'); }

  getPays(): Observable<{ value: string; label: string }[]> {
  return this.http.get<any[]>(`${this.countriesApi}/active`).pipe(
    catchError(() => of([]))
  );
}

  create(item: Partial<ConfigItem>): Observable<ConfigItem> {
    return this.http.post<ConfigItem>(this.api, item).pipe(
      tap(() => this.cache.delete(item.category!))
    );
  }

  delete(id: string, category: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`).pipe(
      tap(() => this.cache.delete(category))
    );
  }

  invalidate(category: string): void {
    this.cache.delete(category);
  }

  // Convertit la couleur sémantique en classes Tailwind
  getStatutClass(color: string | undefined): string {
    switch (color) {
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'danger':  return 'bg-red-100 text-red-800';
      case 'primary': return 'bg-blue-100 text-blue-800';
      default:        return 'bg-gray-100 text-gray-700';
    }
  }
  update(id: string, item: Partial<ConfigItem>): Observable<ConfigItem> {
  return this.http.put<ConfigItem>(`${this.api}/items/${id}`, item).pipe(
    tap(() => this.cache.delete(item.category!))
  );
}
}