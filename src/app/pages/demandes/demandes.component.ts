import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { DemandeService } from 'src/app/services/demande.service';
import { Demande } from 'src/app/models/demande.model';
import { Subject, debounceTime, Subscription, forkJoin } from 'rxjs';
import { DemandesFilterStateService } from 'src/app/services/demandes-filter-state.service';
import { ConfigService, ConfigItem } from 'src/app/services/config.service';
import { MatDialog } from '@angular/material/dialog';
import { PlatformConfigDialogComponent } from '../users/platform-config-dialog/platform-config-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-demandes',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, FormsModule],
  templateUrl: './demandes.component.html',
})
export class DemandesComponent implements OnInit, OnDestroy {
  demandes: Demande[] = [];
  loading = false;
  total = 0;

  selectedStatus = '';
  selectedType = '';
  selectedDestination = '';
  showAdvancedFilters = false;
  filterNiveauEtude = '';
  filterCondidatStatutActuel = '';
  filterFonction = '';
  filterPosteSouhaite = '';
  filterPaysResidence = '';
  filterBesoinVisa: boolean | null = null;
  filterExistenceDeGarant: boolean | null = null;
  filterTypeHebergement: boolean | null = null;
  filterPreinscription: boolean | null = null;
  filterHandicape: boolean | null = null;
  filterExperience = '';
  page = 0;
  limit = 10;
  private textFilter$ = new Subject<void>();
  private subs: Subscription[] = [];

  displayedColumns = [
    'uniqueId', 'user', 'type', 'status',
    'journeesDestination', 'niveauEtude', 'createdAt', 'actions',
  ];

  // ── Listes dynamiques depuis ConfigService ─────────────────────────
  statuts:        { value: string; label: string }[] = [];
  types:          { value: string; label: string }[] = [];
  destinations:   { value: string; label: string }[] = [];
  statutsActuels: { value: string; label: string }[] = [];

  // ── Listes statiques (pas de config nécessaire) ────────────────────
  readonly niveauxEtude    = ['BEP/CAP', 'Baccalauréat', 'BTS', 'Licence', 'Master', 'Doctorat'];
  readonly experienceOptions = ['[0-1]', ']1-3]', ']3-5]', ']5-10]', '+10'];

  constructor(
    private demandeService: DemandeService,
    private filterState:    DemandesFilterStateService,
    private cdr:            ChangeDetectorRef,
    private configService:  ConfigService,
    private dialog:         MatDialog, 
  ) {}

  ngOnInit(): void {
    // ── Charger les listes dynamiques en parallèle ─────────────────
    forkJoin({
      statuts:        this.configService.get('statut_demande'),
      types:          this.configService.get('type_demande'),
      destinations:   this.configService.get('destination_demande'),
      statutsActuels: this.configService.get('statut_professionnel'),
    }).subscribe({
      next: ({ statuts, types, destinations, statutsActuels }) => {
        this.statuts = [
          { value: '', label: 'Tous statuts' },
          ...statuts.map(s => ({ value: s.value, label: s.label }))
        ];
        this.types = [
          { value: '', label: 'Tous types' },
          ...types.map(t => ({ value: t.value, label: t.label }))
        ];
        this.destinations = [
          { value: '', label: 'Toutes destinations' },
          ...destinations.map(d => ({ value: d.value, label: d.label }))
        ];
        this.statutsActuels = statutsActuels.map(s => ({ value: s.value, label: s.label }));
      },
      error: () => {
        // Fallback statique si l'API échoue
        this.statuts = [
          { value: '', label: 'Tous statuts' },
          { value: 'pre_selection', label: 'Pré-sélection' },
          { value: 'selection',     label: 'Sélection' },
          { value: 'accepte',       label: 'Accepté' },
          { value: 'refuse',        label: 'Refusé' },
          { value: 'en_attente',    label: 'En attente' },
        ];
        this.types = [
          { value: '', label: 'Tous types' },
          { value: 'travail', label: 'Travail' },
          { value: 'etude',   label: 'Études' },
          { value: 'stage',   label: 'Stage' },
        ];
        this.destinations = [
          { value: '', label: 'Toutes destinations' },
          { value: 'journees_france',    label: '🇫🇷 France' },
          { value: 'journees_canada',    label: '🇨🇦 Canada' },
          { value: 'journees_allemagne', label: '🇩🇪 Allemagne' },
          { value: 'journees_belgique',  label: '🇧🇪 Belgique' },
        ];
        this.statutsActuels = [
          { value: 'employe',   label: 'Employé' },
          { value: 'chomage',   label: 'Sans emploi' },
          { value: 'etudiant',  label: 'Étudiant' },
          { value: 'freelance', label: 'Freelance' },
        ];
      }
    });

    // ── Restaurer l'état sauvegardé ──────────────────────────────────
    const saved = this.filterState.load();
    this.selectedStatus             = saved.selectedStatus;
    this.selectedType               = saved.selectedType;
    this.selectedDestination        = saved.selectedDestination;
    this.showAdvancedFilters        = saved.showAdvancedFilters;
    this.filterNiveauEtude          = saved.filterNiveauEtude;
    this.filterCondidatStatutActuel = saved.filterCondidatStatutActuel;
    this.filterFonction             = saved.filterFonction;
    this.filterPosteSouhaite        = saved.filterPosteSouhaite;
    this.filterPaysResidence        = saved.filterPaysResidence;
    this.filterBesoinVisa           = saved.filterBesoinVisa;
    this.filterExistenceDeGarant    = saved.filterExistenceDeGarant;
    this.filterTypeHebergement      = saved.filterTypeHebergement;
    this.filterPreinscription       = saved.filterPreinscription;
    this.filterHandicape            = saved.filterHandicape;
    this.filterExperience           = saved.filterExperience;
    this.page                       = saved.page;
    this.limit                      = saved.limit;

    this.cdr.detectChanges();
    this.loadDemandes();

    this.subs.push(
      this.textFilter$.pipe(debounceTime(350)).subscribe(() => {
        this.page = 0;
        this.saveState();
        this.loadDemandes();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private saveState(): void {
    this.filterState.save({
      selectedStatus:             this.selectedStatus,
      selectedType:               this.selectedType,
      selectedDestination:        this.selectedDestination,
      showAdvancedFilters:        this.showAdvancedFilters,
      filterNiveauEtude:          this.filterNiveauEtude,
      filterCondidatStatutActuel: this.filterCondidatStatutActuel,
      filterFonction:             this.filterFonction,
      filterPosteSouhaite:        this.filterPosteSouhaite,
      filterPaysResidence:        this.filterPaysResidence,
      filterBesoinVisa:           this.filterBesoinVisa,
      filterExistenceDeGarant:    this.filterExistenceDeGarant,
      filterTypeHebergement:      this.filterTypeHebergement,
      filterPreinscription:       this.filterPreinscription,
      filterHandicape:            this.filterHandicape,
      filterExperience:           this.filterExperience,
      page:                       this.page,
      limit:                      this.limit,
    });
  }

  onTextFilterChange(): void { this.textFilter$.next(); }

  buildFilters(): any {
    return {
      status:                 this.selectedStatus,
      type:                   this.selectedType,
      journeesDestination:    this.selectedDestination,
      niveauEtude:            this.filterNiveauEtude,
      condidatStatutActuel:   this.filterCondidatStatutActuel,
      fonction:               this.filterFonction,
      posteSouhaite:          this.filterPosteSouhaite,
      paysResidence:          this.filterPaysResidence,
      besoinVisa:             this.filterBesoinVisa,
      existenceDeGarant:      this.filterExistenceDeGarant,
      typeHebergement:        this.filterTypeHebergement,
      preinscription:         this.filterPreinscription,
      handicape:              this.filterHandicape,
      nombreAnneesExperience: this.filterExperience,
    };
  }

  loadDemandes(): void {
    this.loading = true;
    this.demandeService.getAll(this.page, this.limit, this.buildFilters()).subscribe({
      next: (res) => {
        this.demandes = res.data;
        this.total    = res.total;
        this.loading  = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onFilterChange(): void {
    this.page = 0;
    this.saveState();
    this.loadDemandes();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
    this.saveState();
  }

  clearFilters(): void {
    this.selectedStatus             = '';
    this.selectedType               = '';
    this.selectedDestination        = '';
    this.filterNiveauEtude          = '';
    this.filterCondidatStatutActuel = '';
    this.filterFonction             = '';
    this.filterPosteSouhaite        = '';
    this.filterPaysResidence        = '';
    this.filterBesoinVisa           = null;
    this.filterExistenceDeGarant    = null;
    this.filterTypeHebergement      = null;
    this.filterPreinscription       = null;
    this.filterHandicape            = null;
    this.filterExperience           = '';
    this.page                       = 0;
    this.filterState.clear();
    this.loadDemandes();
  }

  get activeAdvancedCount(): number {
    let c = 0;
    if (this.filterNiveauEtude)          c++;
    if (this.filterCondidatStatutActuel) c++;
    if (this.filterFonction)             c++;
    if (this.filterPosteSouhaite)        c++;
    if (this.filterPaysResidence)        c++;
    if (this.filterBesoinVisa    !== null) c++;
    if (this.filterExistenceDeGarant !== null) c++;
    if (this.filterTypeHebergement   !== null) c++;
    if (this.filterPreinscription    !== null) c++;
    if (this.filterHandicape         !== null) c++;
    if (this.filterExperience) c++;
    return c;
  }

  get hasAnyFilter(): boolean {
    return !!(this.selectedStatus || this.selectedType || this.selectedDestination
      || this.activeAdvancedCount > 0);
  }

  onPageChange(event: any): void {
    this.page  = event.pageIndex;
    this.limit = event.pageSize;
    this.saveState();
    this.loadDemandes();
  }

  getStatusColor(status: string): string {
    const found = this.statuts.find(s => s.value === status) as any;
    // Utiliser la couleur de config si disponible, sinon fallback
    return found?.color
      ? this.configService.getStatutClass(found.color)
      : this.defaultStatusColor(status);
  }

  private defaultStatusColor(status: string): string {
    switch (status) {
      case 'accepte':       return 'bg-green-100 text-green-700';
      case 'refuse':        return 'bg-red-100 text-red-700';
      case 'pre_selection': return 'bg-blue-100 text-blue-700';
      case 'selection':     return 'bg-purple-100 text-purple-700';
      case 'en_attente':    return 'bg-yellow-100 text-yellow-700';
      default:              return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusLabel(status: string): string {
    return this.statuts.find(s => s.value === status)?.label || status;
  }

  updateStatus(id: string, status: string): void {
    this.demandeService.updateStatus(id, status).subscribe({
      next: () => this.loadDemandes(),
    });
  }

  deleteDemande(id: string): void {
    if (confirm('Confirmer la suppression ?')) {
      this.demandeService.delete(id).subscribe({
        next: () => this.loadDemandes(),
      });
    }
  }
openConfig(): void {
  const demandesTabs = [
    { key: 'statut_demande',       label: 'Statuts',      icon: 'flag',          system: [] },
    { key: 'type_demande',         label: 'Types',        icon: 'category',      system: [] },
    { key: 'destination_demande',  label: 'Destinations', icon: 'flight_takeoff',system: [] },
    { key: 'statut_professionnel', label: 'Statuts pro',  icon: 'work_history',  system: [] },
  ];

  const dialogRef = this.dialog.open(PlatformConfigDialogComponent, {
    width: '720px',
    maxHeight: '90vh',
    data: { tabs: demandesTabs },  // ← passer uniquement les onglets demandes
  });

  dialogRef.afterClosed().subscribe(() => {
    ['statut_demande', 'type_demande', 'destination_demande', 'statut_professionnel']
      .forEach(cat => this.configService.invalidate(cat));

    forkJoin({
      statuts:        this.configService.get('statut_demande'),
      types:          this.configService.get('type_demande'),
      destinations:   this.configService.get('destination_demande'),
      statutsActuels: this.configService.get('statut_professionnel'),
    }).subscribe(({ statuts, types, destinations, statutsActuels }) => {
      this.statuts = [
        { value: '', label: 'Tous statuts' },
        ...statuts.map(s => ({ value: s.value, label: s.label }))
      ];
      this.types = [
        { value: '', label: 'Tous types' },
        ...types.map(t => ({ value: t.value, label: t.label }))
      ];
      this.destinations = [
        { value: '', label: 'Toutes destinations' },
        ...destinations.map(d => ({ value: d.value, label: d.label }))
      ];
      this.statutsActuels = statutsActuels.map(s => ({ value: s.value, label: s.label }));
    });
  });
}
}