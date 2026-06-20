// src/app/services/demandes-filter-state.service.ts
import { Injectable } from '@angular/core';

const KEY = 'demandes_filter_state';

@Injectable({ providedIn: 'root' })
export class DemandesFilterStateService {

  private defaults = {
    selectedStatus: '',
    selectedType: '',
    selectedDestination: '',
    showAdvancedFilters: false,
    filterNiveauEtude: '',
    filterCondidatStatutActuel: '',
    filterFonction: '',
    filterPosteSouhaite: '',
    filterPaysResidence: '',
    filterBesoinVisa: null as boolean | null,
    filterExistenceDeGarant: null as boolean | null,
    filterTypeHebergement: null as boolean | null,
    filterPreinscription: null as boolean | null,
    filterHandicape: null as boolean | null,
    filterExperience: '',
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