import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // 1. Vérifie cet import
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoleService {
private apiUrl = 'http://localhost:8083/api/roles';
  // 2. Tu DOIS ajouter "private http: HttpClient" dans le constructeur
  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> { 
    return this.http.get<any[]>(this.apiUrl); 
  }

  create(role: { value: string, label: string }): Observable<any> { 
    return this.http.post(this.apiUrl, role); 
  }

  delete(id: string): Observable<any> { 
    return this.http.delete(`${this.apiUrl}/${id}`); 
  }
  update(id: string, role: any): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/${id}`, role);
}
}