// src/app/services/orders-filter-state.service.ts
import { Injectable } from '@angular/core';

const KEY = 'orders_filter_state';

@Injectable({ providedIn: 'root' })
export class OrdersFilterStateService {

  private defaults = {
    search: '',
    type: '',
    status: '',
    country: '',
    currency: '',
    priceMin: null as number | null,
    priceMax: null as number | null,
    dateFrom: null as string | null,
    dateTo: null as string | null,
    showAdvancedFilters: false,
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