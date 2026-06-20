import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, forkJoin, Subscription } from 'rxjs';
import { OrderService } from 'src/app/services/order.service';
import { Order } from 'src/app/models/order.model';
import { OrderDetailDialogComponent } from './order-detail-dialog/order-detail-dialog.component';
import { OrdersFilterStateService } from 'src/app/services/orders-filter-state.service';
import { ConfigService } from 'src/app/services/config.service';
import { PlatformConfigDialogComponent } from '../users/platform-config-dialog/platform-config-dialog.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MaterialModule,
    ReactiveFormsModule, MatDatepickerModule, MatNativeDateModule,
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  pagedOrders: Order[] = [];
  loading = false;

  total = 0;
  page = 0;
  limit = 10;

  showAdvancedFilters = false;
  filterForm!: FormGroup;
  private subs: Subscription[] = [];

  displayedColumns = [
    'orderId', 'bookingId', 'type', 'status',
    'price', 'country', 'date', 'actions',
  ];

  // ── Listes statiques système ───────────────────────────────────────
  readonly statuts = [
    { value: '',          label: 'Tous' },
    { value: 'created',   label: 'Créé' },
    { value: 'paid',      label: 'Payé' },
    { value: 'cancelled', label: 'Annulé' },
    { value: 'completed', label: 'Complété' },
  ];
  readonly statusOptions = this.statuts;

  // ── Listes dynamiques ─────────────────────────────────────────────
  typeOptions:        { value: string; label: string }[] = [];
  destinationOptions: { value: string; label: string }[] = [];
  currencyOptions:    { value: string; label: string }[] = [];

  constructor(
    private orderService:  OrderService,
    private fb:            FormBuilder,
    private dialog:        MatDialog,
    private snackBar:      MatSnackBar,
    private filterState:   OrdersFilterStateService,
    private cdr:           ChangeDetectorRef,
    private configService: ConfigService,
  ) {}

  ngOnInit(): void {
    // ── Charger les listes dynamiques ────────────────────────────────
    forkJoin({
      types:        this.configService.get('type_booking'),
      destinations: this.configService.get('destination_demande'),
      currencies:   this.configService.get('devise'),
    }).subscribe({
      next: ({ types, destinations, currencies }) => {
        this.typeOptions = [
          { value: '', label: 'Tous les types' },
          { value: 'balance_topup', label: 'Rechargement de solde' },
          ...types.map(t => ({ value: t.value, label: t.label }))
        ];
        this.destinationOptions = [
          { value: '', label: 'Toutes les destinations' },
          ...destinations.map(d => ({
            value: d.value.replace('journees_', ''), // stocker le country court
            label: d.label
          }))
        ];
        this.currencyOptions = [
          { value: '', label: 'Toutes devises' },
          ...currencies.map(c => ({ value: c.value, label: c.label }))
        ];
      },
      error: () => {
        this.typeOptions = [
          { value: '', label: 'Tous les types' },
          { value: 'simple',       label: 'Simple' },
          { value: 'standard',     label: 'Standard' },
          { value: 'premium',      label: 'Premium' },
          { value: 'pro',          label: 'Pro' },
          { value: 'balance_topup',label: 'Rechargement de solde' },
        ];
        this.destinationOptions = [
          { value: '',         label: 'Toutes les destinations' },
          { value: 'france',   label: '🇫🇷 France' },
          { value: 'canada',   label: '🇨🇦 Canada' },
          { value: 'allemagne',label: '🇩🇪 Allemagne' },
          { value: 'belgique', label: '🇧🇪 Belgique' },
        ];
        this.currencyOptions = [
          { value: '',    label: 'Toutes devises' },
          { value: 'TND', label: 'TND — Dinar tunisien' },
          { value: 'EUR', label: 'EUR — Euro' },
          { value: 'USD', label: 'USD — Dollar américain' },
        ];
      }
    });

    // ── Restaurer l'état ──────────────────────────────────────────────
    const saved = this.filterState.load();
    this.showAdvancedFilters = saved.showAdvancedFilters;
    this.page  = saved.page;
    this.limit = saved.limit;

    this.filterForm = this.fb.group({
      search:   [saved.search],
      type:     [saved.type],
      status:   [saved.status],
      country:  [saved.country],
      currency: [saved.currency],
      priceMin: [saved.priceMin],
      priceMax: [saved.priceMax],
      dateFrom: [saved.dateFrom ? new Date(saved.dateFrom) : null],
      dateTo:   [saved.dateTo   ? new Date(saved.dateTo)   : null],
    });

    this.cdr.detectChanges();
    this.loadOrders();

    this.subs.push(
      this.filterForm.valueChanges.pipe(debounceTime(150)).subscribe(() => {
        this.saveState();
        this.applyFilters();
      })
    );
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  private saveState(): void {
    const f = this.filterForm.value;
    this.filterState.save({
      search:              f.search   || '',
      type:                f.type     || '',
      status:              f.status   || '',
      country:             f.country  || '',
      currency:            f.currency || '',
      priceMin:            f.priceMin ?? null,
      priceMax:            f.priceMax ?? null,
      dateFrom:            f.dateFrom ? (f.dateFrom instanceof Date ? f.dateFrom.toISOString() : f.dateFrom) : null,
      dateTo:              f.dateTo   ? (f.dateTo   instanceof Date ? f.dateTo.toISOString()   : f.dateTo)   : null,
      showAdvancedFilters: this.showAdvancedFilters,
      page:                this.page,
      limit:               this.limit,
    });
  }

  // ── Paramètres orders ─────────────────────────────────────────────
  openConfig(): void {
    const ordersTabs = [
      { key: 'type_booking',       label: 'Types',        icon: 'category',       system: [] },
      { key: 'devise',             label: 'Devises',      icon: 'currency_exchange', system: [] },
      { key: 'destination_demande',label: 'Destinations', icon: 'flight_takeoff', system: [] },
    ];

    const dialogRef = this.dialog.open(PlatformConfigDialogComponent, {
      width: '720px',
      maxHeight: '90vh',
      data: { tabs: ordersTabs, title: 'Paramètres des orders' },
    });

    dialogRef.afterClosed().subscribe(() => {
      ['type_booking', 'devise', 'destination_demande']
        .forEach(cat => this.configService.invalidate(cat));

      forkJoin({
        types:        this.configService.get('type_booking'),
        destinations: this.configService.get('destination_demande'),
        currencies:   this.configService.get('devise'),
      }).subscribe(({ types, destinations, currencies }) => {
        this.typeOptions = [
          { value: '', label: 'Tous les types' },
          { value: 'balance_topup', label: 'Rechargement de solde' },
          ...types.map(t => ({ value: t.value, label: t.label }))
        ];
        this.destinationOptions = [
          { value: '', label: 'Toutes les destinations' },
          ...destinations.map(d => ({
            value: d.value.replace('journees_', ''),
            label: d.label
          }))
        ];
        this.currencyOptions = [
          { value: '', label: 'Toutes devises' },
          ...currencies.map(c => ({ value: c.value, label: c.label }))
        ];
      });
    });
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getAll(0, 10000).subscribe({
      next: (res: any) => {
        this.orders = res.data?.content || res.data?.items || res.data || res || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement des orders', 'Fermer', { duration: 3000 });
      },
    });
  }

  applyFilters(): void {
    const f = this.filterForm.value;
    const search = (f.search || '').toLowerCase().trim();

    this.filteredOrders = this.orders.filter((o: any) => {
      if (search) {
        const haystack = [o.orderId, o.bookingId, o.userId, o.description]
          .filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (f.type    && o.type     !== f.type)     return false;
      if (f.status  && o.status   !== f.status)   return false;
      if (f.country && o.country  !== f.country)  return false;
      if (f.currency && o.currency !== f.currency) return false;
      const amount = o.price ?? o.amount;
      if (f.priceMin != null && f.priceMin !== '' && (amount == null || amount < f.priceMin)) return false;
      if (f.priceMax != null && f.priceMax !== '' && (amount == null || amount > f.priceMax)) return false;
      if (f.dateFrom || f.dateTo) {
        const oDate = new Date(o.date || o.createdAt);
        if (f.dateFrom && oDate < new Date(f.dateFrom)) return false;
        if (f.dateTo) {
          const dateTo = new Date(f.dateTo);
          dateTo.setHours(23, 59, 59, 999);
          if (oDate > dateTo) return false;
        }
      }
      return true;
    });

    this.total = this.filteredOrders.length;
    this.updatePagedOrders();
  }

  updatePagedOrders(): void {
    const start = this.page * this.limit;
    this.pagedOrders = this.filteredOrders.slice(start, start + this.limit);
  }

  onPageChange(event: any): void {
    this.page  = event.pageIndex;
    this.limit = event.pageSize;
    this.saveState();
    this.updatePagedOrders();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
    this.saveState();
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '', type: '', status: '', country: '', currency: '',
      priceMin: null, priceMax: null, dateFrom: null, dateTo: null,
    });
    this.page = 0;
    this.filterState.clear();
  }

  clearFilter(key: string): void {
    this.filterForm.get(key)?.setValue(
      key.startsWith('price') || key.startsWith('date') ? null : ''
    );
  }

  get activeFilterChips(): { key: string; label: string }[] {
    const f = this.filterForm.value;
    const chips: { key: string; label: string }[] = [];
    if (f.search)   chips.push({ key: 'search',   label: `Recherche: "${f.search}"` });
    if (f.type) {
      const opt = this.typeOptions.find(o => o.value === f.type);
      chips.push({ key: 'type', label: `Type: ${opt?.label}` });
    }
    if (f.status) {
      const opt = this.statusOptions.find(o => o.value === f.status);
      chips.push({ key: 'status', label: `Statut: ${opt?.label}` });
    }
    if (f.country) {
      const opt = this.destinationOptions.find(o => o.value === f.country);
      chips.push({ key: 'country', label: `Destination: ${opt?.label || f.country}` });
    }
    if (f.currency) chips.push({ key: 'currency', label: `Devise: ${f.currency}` });
    if (f.priceMin != null && f.priceMin !== '') chips.push({ key: 'priceMin', label: `Montant min: ${f.priceMin}` });
    if (f.priceMax != null && f.priceMax !== '') chips.push({ key: 'priceMax', label: `Montant max: ${f.priceMax}` });
    if (f.dateFrom) chips.push({ key: 'dateFrom', label: `Depuis: ${new Date(f.dateFrom).toLocaleDateString('fr-FR')}` });
    if (f.dateTo)   chips.push({ key: 'dateTo',   label: `Jusqu'au: ${new Date(f.dateTo).toLocaleDateString('fr-FR')}` });
    return chips;
  }

  get hasActiveFilters(): boolean { return this.activeFilterChips.length > 0; }

  viewDetails(order: Order): void {
    this.dialog.open(OrderDetailDialogComponent, { width: '480px', data: order });
  }

  updateStatus(id: string, status: string): void {
    this.orderService.updateStatus(id, status).subscribe({ next: () => this.loadOrders() });
  }

  deleteOrder(id: string): void {
    if (confirm('Confirmer la suppression ?')) {
      this.orderService.delete(id).subscribe({ next: () => this.loadOrders() });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
      case 'paid':      return 'bg-green-100 text-green-700';
      case 'created':   return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default:          return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusLabel(status: string): string {
    return this.statuts.find(s => s.value === status)?.label || status;
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'premium':       return 'bg-purple-100 text-purple-700';
      case 'pro':           return 'bg-indigo-100 text-indigo-700';
      case 'standard':      return 'bg-cyan-100 text-cyan-700';
      case 'balance_topup': return 'bg-emerald-100 text-emerald-700';
      default:              return 'bg-blue-100 text-blue-700';
    }
  }

  getDestinationLabel(country: string): string {
    return this.destinationOptions.find(d => d.value === country)?.label || country || '—';
  }
}