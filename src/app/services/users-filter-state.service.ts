// src/app/services/users-filter-state.service.ts
import { Injectable } from '@angular/core';

const KEY = 'users_filter_state';

@Injectable({ providedIn: 'root' })
export class UsersFilterStateService {

  private defaults = {
    selectedRole: 'candidat',
    selectedStatus: '',
    searchValue: '',
    showAdvancedFilters: false,
    filterSexe: '',
    filterPays: '',
    filterPhone: '',
    filterNationalite: '',
    filterAdresse: '',
    filterCodePostal: '',
    filterJobFavori: '',
    filterFonction: '',
    page: 0,
    limit: 10,
  };

  save(state: Partial<typeof this.defaults>): void {
    const current = this.load();
    sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...state }));
  }

  load(): typeof this.defaults {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? { ...this.defaults, ...JSON.parse(raw) } : { ...this.defaults };
    } catch {
      return { ...this.defaults };
    }
  }

  clear(): void {
    sessionStorage.setItem(KEY, JSON.stringify({ ...this.defaults }));
  }
}