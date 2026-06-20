import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BookingService } from 'src/app/services/booking.service';
import { BookingsFilterStateService } from 'src/app/services/bookings-filter-state.service';
import { ConfigService, ConfigItem } from 'src/app/services/config.service';
import { PlatformConfigDialogComponent } from '../users/platform-config-dialog/platform-config-dialog.component';
import { debounceTime, forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MaterialModule,
    ReactiveFormsModule, MatDatepickerModule, MatNativeDateModule,
  ],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss'],
})
export class BookingsComponent implements OnInit, OnDestroy {
  bookings: any[] = [];
  filteredBookings: any[] = [];
  pagedBookings: any[] = [];
  loading = true;

  total = 0;
  page = 0;
  limit = 10;

  showAdvancedFilters = false;
  filterForm!: FormGroup;
  private subs: Subscription[] = [];

  displayedColumns: string[] = [
    'uniqueId', 'appointmentType', 'appointmentDate', 'appointmentTime',
    'price', 'paymentStatus', 'status', 'interviewStatus', 'interviewScore', 'actions',
  ];

  // ── Listes dynamiques ─────────────────────────────────────────────
  typeOptions:              { value: string; label: string }[] = [];
  paymentOptions:           { value: string; label: string }[] = [];
  interviewStatusOptions:   { value: string; label: string }[] = [];
  interviewCompletedOptions:{ value: string; label: string }[] = [];
  destinationOptions:       { value: string; label: string }[] = [];

  // ── Listes statiques (valeurs système) ────────────────────────────
  readonly statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'confirmed', label: 'Confirmé' },
    { value: 'pending',   label: 'En attente' },
    { value: 'cancelled', label: 'Annulé' },
  ];

  readonly statuts = [
    { value: '', label: 'Tous les statuts' },
    { value: 'confirmed', label: 'Confirmé' },
    { value: 'pending',   label: 'En attente' },
    { value: 'cancelled', label: 'Annulé' },
  ];

  constructor(
    private bookingService: BookingService,
    private fb:             FormBuilder,
    private router:         Router,
    private snackBar:       MatSnackBar,
    private dialog:         MatDialog,
    private filterState:    BookingsFilterStateService,
    private cdr:            ChangeDetectorRef,
    private configService:  ConfigService,
  ) {}

  ngOnInit(): void {
    // ── Charger les listes dynamiques ────────────────────────────────
    forkJoin({
      types:              this.configService.get('type_booking'),
      payments:           this.configService.get('statut_paiement'),
      interviewStatuts:   this.configService.get('statut_entretien'),
      interviewCompleted: this.configService.get('entretien_complete'),
      destinations:       this.configService.get('destination_demande'),
    }).subscribe({
      next: ({ types, payments, interviewStatuts, interviewCompleted, destinations }) => {
        this.typeOptions = [
          { value: '', label: 'Tous les types' },
          ...types.map(t => ({ value: t.value, label: t.label }))
        ];
        this.paymentOptions = [
          { value: '', label: 'Tous les paiements' },
          ...payments.map(p => ({ value: p.value, label: p.label }))
        ];
        this.interviewStatusOptions = [
          { value: '', label: 'Tous les entretiens' },
          ...interviewStatuts.map(s => ({ value: s.value, label: s.label }))
        ];
        this.interviewCompletedOptions = [
          { value: '', label: 'Tous' },
          ...interviewCompleted.map(c => ({ value: c.value, label: c.label }))
        ];
        this.destinationOptions = [
          { value: '', label: 'Toutes les destinations' },
          ...destinations.map(d => ({ value: d.value, label: d.label }))
        ];
      },
      error: () => {
        // Fallback statique
        this.typeOptions              = [{ value: '', label: 'Tous les types' }, { value: 'simple', label: 'Simple' }, { value: 'standard', label: 'Standard' }, { value: 'premium', label: 'Premium' }, { value: 'pro', label: 'Pro' }];
        this.paymentOptions           = [{ value: '', label: 'Tous les paiements' }, { value: 'paid', label: 'Payé' }, { value: 'pending', label: 'En attente' }, { value: 'created', label: 'Créé' }, { value: 'failed', label: 'Échoué' }];
        this.interviewStatusOptions   = [{ value: '', label: 'Tous les entretiens' }, { value: 'En attente', label: 'En attente' }, { value: 'Complété', label: 'Complété' }];
        this.interviewCompletedOptions= [{ value: '', label: 'Tous' }, { value: 'yes', label: 'Complété' }, { value: 'no', label: 'Non complété' }];
        this.destinationOptions       = [{ value: '', label: 'Toutes les destinations' }, { value: 'journees_france', label: '🇫🇷 France' }, { value: 'journees_canada', label: '🇨🇦 Canada' }];
      }
    });

    // ── Restaurer l'état ──────────────────────────────────────────────
    const saved = this.filterState.load();
    this.showAdvancedFilters = saved.showAdvancedFilters;
    this.page  = saved.page;
    this.limit = saved.limit;

    this.filterForm = this.fb.group({
      search:              [saved.search],
      appointmentType:     [saved.appointmentType],
      status:              [saved.status],
      paymentStatus:       [saved.paymentStatus],
      interviewStatus:     [saved.interviewStatus],
      journeesDestination: [saved.journeesDestination],
      interviewCompleted:  [saved.interviewCompleted],
      priceMin:            [saved.priceMin],
      priceMax:            [saved.priceMax],
      dateFrom:            [saved.dateFrom ? new Date(saved.dateFrom) : null],
      dateTo:              [saved.dateTo   ? new Date(saved.dateTo)   : null],
    });

    this.cdr.detectChanges();
    this.loadBookings();

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
      search:              f.search || '',
      appointmentType:     f.appointmentType || '',
      status:              f.status || '',
      paymentStatus:       f.paymentStatus || '',
      interviewStatus:     f.interviewStatus || '',
      journeesDestination: f.journeesDestination || '',
      interviewCompleted:  f.interviewCompleted || '',
      priceMin:            f.priceMin ?? null,
      priceMax:            f.priceMax ?? null,
      dateFrom:            f.dateFrom ? (f.dateFrom instanceof Date ? f.dateFrom.toISOString() : f.dateFrom) : null,
      dateTo:              f.dateTo   ? (f.dateTo   instanceof Date ? f.dateTo.toISOString()   : f.dateTo)   : null,
      showAdvancedFilters: this.showAdvancedFilters,
      page:                this.page,
      limit:               this.limit,
    });
  }

  // ── Paramètres booking ────────────────────────────────────────────
 openConfig(): void {
  const bookingTabs = [
    { key: 'type_booking',        label: 'Types RDV',    icon: 'event',             system: [] },
    { key: 'statut_paiement',     label: 'Paiements',    icon: 'payment',           system: [] },
    { key: 'statut_entretien',    label: 'Entretiens',   icon: 'record_voice_over', system: [] },
    { key: 'entretien_complete',  label: 'Complété',     icon: 'check_circle',      system: [] },
    { key: 'destination_demande', label: 'Destinations', icon: 'flight_takeoff',    system: [] },
  ];

  const dialogRef = this.dialog.open(PlatformConfigDialogComponent, {
    width: '720px',
    maxHeight: '90vh',
    data: { tabs: bookingTabs, title: 'Paramètres des bookings' },
  });

  dialogRef.afterClosed().subscribe(() => {
    ['type_booking', 'statut_paiement', 'statut_entretien', 'entretien_complete', 'destination_demande']
      .forEach(cat => this.configService.invalidate(cat));

    forkJoin({
      types:              this.configService.get('type_booking'),
      payments:           this.configService.get('statut_paiement'),
      interviewStatuts:   this.configService.get('statut_entretien'),
      interviewCompleted: this.configService.get('entretien_complete'),
      destinations:       this.configService.get('destination_demande'),
    }).subscribe(({ types, payments, interviewStatuts, interviewCompleted, destinations }) => {
      this.typeOptions = [
        { value: '', label: 'Tous les types' },
        ...types.map(t => ({ value: t.value, label: t.label }))
      ];
      this.paymentOptions = [
        { value: '', label: 'Tous les paiements' },
        ...payments.map(p => ({ value: p.value, label: p.label }))
      ];
      this.interviewStatusOptions = [
        { value: '', label: 'Tous les entretiens' },
        ...interviewStatuts.map(s => ({ value: s.value, label: s.label }))
      ];
      this.interviewCompletedOptions = [
        { value: '', label: 'Tous' },
        ...interviewCompleted.map(c => ({ value: c.value, label: c.label }))
      ];
      this.destinationOptions = [
        { value: '', label: 'Toutes les destinations' },
        ...destinations.map(d => ({ value: d.value, label: d.label }))
      ];
    });
  });
}

  loadBookings(): void {
    this.loading = true;
    this.bookingService.getAll(0, 10000).subscribe({
      next: (res: any) => {
        this.bookings = res.data?.content || res.data?.items || res.data || res || [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement des bookings', 'Fermer', { duration: 3000 });
      },
    });
  }

  applyFilters(): void {
    const f = this.filterForm.value;
    const search = (f.search || '').toLowerCase().trim();

    this.filteredBookings = this.bookings.filter((b) => {
      if (search) {
        const haystack = [b.uniqueId, b.appointmentType, b.journeesDestination, b.userId, b.demandeId]
          .filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (f.appointmentType && b.appointmentType !== f.appointmentType) return false;
      if (f.status && b.status !== f.status) return false;
      if (f.paymentStatus && b.paymentStatus !== f.paymentStatus) return false;
      if (f.interviewStatus && b.interviewStatus !== f.interviewStatus) return false;
      if (f.journeesDestination && b.journeesDestination !== f.journeesDestination) return false;
      if (f.interviewCompleted === 'yes' && !b.interviewCompleted) return false;
      if (f.interviewCompleted === 'no'  &&  b.interviewCompleted) return false;
      if (f.priceMin != null && f.priceMin !== '' && b.price < f.priceMin) return false;
      if (f.priceMax != null && f.priceMax !== '' && b.price > f.priceMax) return false;
      if (f.dateFrom) {
        if (new Date(b.appointmentDate) < new Date(f.dateFrom)) return false;
      }
      if (f.dateTo) {
        const dateTo = new Date(f.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        if (new Date(b.appointmentDate) > dateTo) return false;
      }
      return true;
    });

    this.total = this.filteredBookings.length;
    this.updatePagedBookings();
  }

  updatePagedBookings(): void {
    const start = this.page * this.limit;
    this.pagedBookings = this.filteredBookings.slice(start, start + this.limit);
  }

  onPageChange(event: any): void {
    this.page  = event.pageIndex;
    this.limit = event.pageSize;
    this.saveState();
    this.updatePagedBookings();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
    this.saveState();
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '', appointmentType: '', status: '', paymentStatus: '',
      interviewStatus: '', journeesDestination: '', interviewCompleted: '',
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
    if (f.search) chips.push({ key: 'search', label: `Recherche: "${f.search}"` });
    if (f.appointmentType) {
      const opt = this.typeOptions.find(o => o.value === f.appointmentType);
      chips.push({ key: 'appointmentType', label: `Type: ${opt?.label}` });
    }
    if (f.status) {
      const opt = this.statusOptions.find(o => o.value === f.status);
      chips.push({ key: 'status', label: `Statut: ${opt?.label}` });
    }
    if (f.paymentStatus) {
      const opt = this.paymentOptions.find(o => o.value === f.paymentStatus);
      chips.push({ key: 'paymentStatus', label: `Paiement: ${opt?.label}` });
    }
    if (f.interviewStatus) chips.push({ key: 'interviewStatus', label: `Entretien: ${f.interviewStatus}` });
    if (f.journeesDestination) {
      const opt = this.destinationOptions.find(o => o.value === f.journeesDestination);
      chips.push({ key: 'journeesDestination', label: `Destination: ${opt?.label}` });
    }
    if (f.interviewCompleted) {
      const opt = this.interviewCompletedOptions.find(o => o.value === f.interviewCompleted);
      chips.push({ key: 'interviewCompleted', label: `Entretien: ${opt?.label}` });
    }
    if (f.priceMin != null && f.priceMin !== '') chips.push({ key: 'priceMin', label: `Prix min: ${f.priceMin}` });
    if (f.priceMax != null && f.priceMax !== '') chips.push({ key: 'priceMax', label: `Prix max: ${f.priceMax}` });
    if (f.dateFrom) chips.push({ key: 'dateFrom', label: `Depuis: ${new Date(f.dateFrom).toLocaleDateString('fr-FR')}` });
    if (f.dateTo)   chips.push({ key: 'dateTo',   label: `Jusqu'au: ${new Date(f.dateTo).toLocaleDateString('fr-FR')}` });
    return chips;
  }

  get hasActiveFilters(): boolean { return this.activeFilterChips.length > 0; }

  getStatusClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending':   return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default:          return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending':   return 'En attente';
      case 'cancelled': return 'Annulé';
      default:          return status;
    }
  }

  getPaymentClass(status: string): string {
    const found = this.paymentOptions.find(p => p.value === status) as any;
    if (!found) return 'bg-gray-100 text-gray-700';
    return this.configService.getStatutClass(found.color);
  }

  getPaymentLabel(status: string): string {
    return this.paymentOptions.find(p => p.value === status)?.label || status;
  }

  getInterviewClass(status: string): string {
    switch (status) {
      case 'Complété':
      case 'Admis':
      case 'Dossier Finalisé': return 'bg-green-100 text-green-700';
      case 'En attente':
      case 'En attente des résultats': return 'bg-yellow-100 text-yellow-700';
      case 'Annulé':   return 'bg-red-100 text-red-700';
      case 'En cours': return 'bg-blue-100 text-blue-700';
      default:         return 'bg-gray-100 text-gray-700';
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'premium':  return 'bg-purple-100 text-purple-700';
      case 'pro':      return 'bg-indigo-100 text-indigo-700';
      case 'standard': return 'bg-cyan-100 text-cyan-700';
      default:         return 'bg-blue-100 text-blue-700';
    }
  }

  updateStatus(id: string, status: string): void {
    this.bookingService.updateStatus(id, status).subscribe({
      next: () => this.loadBookings(),
    });
  }

  deleteBooking(id: string): void {
    if (!confirm('Voulez-vous vraiment supprimer ce booking ?')) return;
    this.bookingService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Booking supprimé', 'Fermer', { duration: 3000 });
        this.loadBookings();
      },
      error: (err: any) => {
        this.snackBar.open(err.error?.message || 'Erreur lors de la suppression', 'Fermer', { duration: 4000 });
      },
    });
  }

 openScoreDialog(booking: any): void {
  // Créer un overlay élégant directement dans le DOM
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.15s ease;
  `;

  const currentScore = booking.interviewScore ?? 0;

  overlay.innerHTML = `
    <style>
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      .score-card { animation: slideUp 0.2s ease; }
      .score-star { cursor: pointer; transition: transform 0.1s; font-size: 28px; }
      .score-star:hover { transform: scale(1.2); }
      .score-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
      .score-input::-webkit-inner-spin-button { -webkit-appearance: none; }
      .btn-cancel:hover { background: #f1f5f9; }
      .btn-save:hover { background: #4f46e5; }
      .score-bar-fill { transition: width 0.4s cubic-bezier(0.4,0,0.2,1); }
    </style>

    <div class="score-card" style="
      background: white;
      border-radius: 20px;
      padding: 32px;
      width: 380px;
      max-width: 95vw;
      box-shadow: 0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1);
    ">
      <!-- Header -->
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
        <div style="
          width:44px; height:44px; border-radius:12px;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          display:flex; align-items:center; justify-content:center;
          font-size:22px; box-shadow: 0 4px 12px rgba(245,158,11,0.3);
        ">⭐</div>
        <div>
          <p style="margin:0; font-size:16px; font-weight:700; color:#0f172a;">
            Évaluer le candidat
          </p>
          <p style="margin:0; font-size:12px; color:#94a3b8;">
            Score actuel : <strong style="color:#f59e0b;">${currentScore}/100</strong>
          </p>
        </div>
      </div>

      <!-- Barre de progression visuelle -->
      <div style="margin-bottom:20px;">
        <div style="
          height:8px; background:#f1f5f9; border-radius:999px; overflow:hidden;
        ">
          <div id="score-bar" class="score-bar-fill" style="
            height:100%; border-radius:999px;
            background: linear-gradient(90deg, #6366f1, #8b5cf6);
            width: ${currentScore}%;
          "></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:4px;">
          <span style="font-size:10px; color:#cbd5e1;">0</span>
          <span id="score-display" style="font-size:11px; font-weight:700; color:#6366f1;">
            ${currentScore}%
          </span>
          <span style="font-size:10px; color:#cbd5e1;">100</span>
        </div>
      </div>

      <!-- Étoiles rapides -->
      <div style="display:flex; gap:6px; justify-content:center; margin-bottom:20px;">
        ${[20, 40, 60, 80, 100].map((v, i) => `
          <button class="score-star" data-value="${v}"
            title="${v}/100"
            style="background:none; border:none; padding:4px; color: ${currentScore >= v ? '#f59e0b' : '#e2e8f0'};"
          >★</button>
        `).join('')}
      </div>
      <div style="text-align:center; margin-top:-12px; margin-bottom:16px;">
        <span style="font-size:10px; color:#94a3b8;">Cliquer sur une étoile pour sélection rapide</span>
      </div>

      <!-- Input manuel -->
      <div style="margin-bottom:24px;">
        <label style="
          display:block; font-size:12px; font-weight:600;
          color:#64748b; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.05em;
        ">Score précis (0 — 100)</label>
        <div style="display:flex; align-items:center; gap:8px;">
          <input
            id="score-input"
            class="score-input"
            type="number" min="0" max="100"
            value="${currentScore}"
            style="
              flex:1; padding:12px 14px; font-size:22px; font-weight:700;
              text-align:center; border:2px solid #e2e8f0; border-radius:12px;
              color:#0f172a; background:#f8fafc;
              transition: border-color 0.2s, box-shadow 0.2s;
            "
          />
          <span style="font-size:18px; color:#94a3b8; font-weight:600;">/100</span>
        </div>
      </div>

      <!-- Boutons -->
      <div style="display:flex; gap:10px;">
        <button id="btn-cancel" class="btn-cancel" style="
          flex:1; padding:12px; border-radius:12px;
          border:1.5px solid #e2e8f0; background:white;
          font-size:14px; font-weight:600; color:#64748b;
          cursor:pointer; transition: background 0.15s;
        ">Annuler</button>
        <button id="btn-save" class="btn-save" style="
          flex:2; padding:12px; border-radius:12px;
          border:none; background:#6366f1;
          font-size:14px; font-weight:700; color:white;
          cursor:pointer; transition: background 0.15s;
          display:flex; align-items:center; justify-content:center; gap:6px;
        ">
          <span>✓</span> Enregistrer
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const input    = overlay.querySelector('#score-input')    as HTMLInputElement;
  const bar      = overlay.querySelector('#score-bar')      as HTMLElement;
  const display  = overlay.querySelector('#score-display')  as HTMLElement;
  const stars    = overlay.querySelectorAll('.score-star')  as NodeListOf<HTMLButtonElement>;
  const btnSave  = overlay.querySelector('#btn-save')       as HTMLButtonElement;
  const btnCancel= overlay.querySelector('#btn-cancel')     as HTMLButtonElement;

  // Mise à jour barre + display + étoiles
  const updateVisuals = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    bar.style.width = `${clamped}%`;
    display.textContent = `${clamped}%`;

    // Couleur de la barre selon le score
    if (clamped >= 70)       bar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
    else if (clamped >= 40)  bar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    else                     bar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';

    // Étoiles colorées
    stars.forEach((star, i) => {
      star.style.color = clamped >= Number(star.dataset['value']) ? '#f59e0b' : '#e2e8f0';
    });
  };

  // Écouter l'input
  input.addEventListener('input', () => {
    updateVisuals(parseFloat(input.value) || 0);
  });

  // Clic sur étoile
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = Number(star.dataset['value']);
      input.value = String(val);
      updateVisuals(val);
    });
  });

  // Fermer sur fond
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });

  // Annuler
  btnCancel.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  // Enregistrer
  btnSave.addEventListener('click', () => {
    const newScore = parseFloat(input.value);
    if (isNaN(newScore) || newScore < 0 || newScore > 100) {
      input.style.borderColor = '#ef4444';
      input.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.2)';
      return;
    }

    btnSave.innerHTML = '<span style="animation:spin 0.6s linear infinite;display:inline-block;">⟳</span> Enregistrement...';
    btnSave.style.opacity = '0.7';
    btnSave.disabled = true;

    this.bookingService.updateScore(booking.id || booking._id, newScore).subscribe({
      next: () => {
        document.body.removeChild(overlay);
        this.snackBar.open(`Score mis à jour : ${newScore}/100`, 'Fermer', { duration: 3000 });
        this.loadBookings();
      },
      error: () => {
        document.body.removeChild(overlay);
        this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
      },
    });
  });

  // Focus auto
  setTimeout(() => input.focus(), 100);
}
}