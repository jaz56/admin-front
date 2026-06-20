import { Component, OnInit, OnDestroy ,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user.model';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UserAddDialogComponent } from './user-add-dialog/user-add-dialog.component';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { RoleService } from 'src/app/services/role.service';
import { UsersFilterStateService } from 'src/app/services/users-filter-state.service';
import { PlatformConfigDialogComponent } from './platform-config-dialog/platform-config-dialog.component';
import { ConfigService, ConfigItem } from 'src/app/services/config.service';
import { CountryService } from 'src/app/services/country.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, UserAddDialogComponent,MatAutocompleteModule,],
  templateUrl: './users.component.html',
  styles: [`
    .pays-suggestion-item:hover {
      background: #f0f9ff !important;
    }
    .pays-suggestion-item:last-child {
      border-bottom: none !important;
    }
  `]
})
export class UsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = false;
  total = 0;

  // ── État des filtres (initialisé depuis sessionStorage) ───────────────
  selectedRole = 'candidat';
  selectedStatus = '';
  showAdvancedFilters = false;
  filterSexe = '';
  filterPays = '';
  filterPhone = '';
  filterNationalite = '';
  filterAdresse = '';
  filterCodePostal = '';
  filterJobFavori = '';
  filterFonction = '';
  page = 0;
  limit = 10;
allPays: { value: string; label: string }[] = [];
filteredPaysFilter: { value: string; label: string }[] = [];
showPaysSuggestions = false;
  searchControl = new FormControl('');
  private textFilter$ = new Subject<void>();
  private subs: Subscription[] = [];
  roles: any[] = [];

  displayedColumns = ['nom', 'email', 'numeroTel', 'role', 'pays', 'candidateVerificationStatus', 'createdAt', 'actions'];

 statuts: ConfigItem[] = [];


  sexes = [
    { value: '', label: 'Tous' },
    { value: 'H', label: 'Homme' },
    { value: 'F', label: 'Femme' }
  ];

  constructor(
  private dialog: MatDialog,
  private userService: UserService,
  private roleService: RoleService,
  private router: Router,
  private filterState: UsersFilterStateService,
  private cdr: ChangeDetectorRef,
  private configService: ConfigService,
  private countryService: CountryService,  // ← ajouter
) {}

 ngOnInit(): void {
  // ── Statuts depuis l'API ──────────────────────────────────────────
  this.configService.getStatuts().subscribe((s: ConfigItem[]) => {
    this.statuts = [
      { id: '', category: '', value: '', label: 'Tous les statuts', order: 0 } as ConfigItem,
      ...s
    ];
  });

    // Restaurer l'état
    const saved = this.filterState.load();
    this.selectedRole         = saved.selectedRole;
    this.selectedStatus       = saved.selectedStatus;
    this.showAdvancedFilters  = saved.showAdvancedFilters;
    this.filterSexe           = saved.filterSexe;
    this.filterPays           = saved.filterPays;
    this.filterPhone          = saved.filterPhone;
    this.filterNationalite    = saved.filterNationalite;
    this.filterAdresse        = saved.filterAdresse;
    this.filterCodePostal     = saved.filterCodePostal;
    this.filterJobFavori      = saved.filterJobFavori;
    this.filterFonction       = saved.filterFonction;
    this.page                 = saved.page;
    this.limit                = saved.limit;
    this.searchControl.setValue(saved.searchValue, { emitEvent: false });

    // ← Forcer Angular à relire les valeurs restaurées
    this.cdr.detectChanges();

    this.loadRoles();
    this.countryService.getActiveForSelect().subscribe(pays => {
  this.allPays = pays;
});
    this.loadUsers();

    this.subs.push(
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => {
        this.page = 0;
        this.saveState();
        this.loadUsers();
      })
    );

    this.subs.push(
      this.textFilter$.pipe(
        debounceTime(350)
      ).subscribe(() => {
        this.page = 0;
        this.saveState();
        this.loadUsers();
      })
    );
  }
onPaysFilterInput(): void {
  const term = (this.filterPays || '').toLowerCase().trim();
  if (!term) {
    this.filteredPaysFilter = [];
  } else {
    this.filteredPaysFilter = this.allPays
      .filter(p => p.label.toLowerCase().includes(term))
      .slice(0, 10);
  }
  // Déclencher le filtre serveur avec debounce
  this.textFilter$.next();
}
selectPays(pays: { value: string; label: string }): void {
  this.filterPays = pays.label;
  this.showPaysSuggestions = false;
  this.onFilterChange();
}
onPaysSelected(event: MatAutocompleteSelectedEvent): void {
  this.filterPays = event.option.value;
  this.filteredPaysFilter = [];
  this.page = 0;
  this.saveState();
  this.loadUsers();
}
clearPaysFilter(): void {
  this.filterPays = '';
  this.filteredPaysFilter = [];
  this.page = 0;
  this.saveState();
  this.loadUsers();
}


hidePaysSuggestions(): void {
  // Délai pour laisser le clic sur une suggestion s'exécuter
  setTimeout(() => { this.showPaysSuggestions = false; }, 200);
}
  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
highlightMatch(label: string, term: string): string {
  if (!term) return label;
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return label.replace(regex, '<strong style="color:#2563eb;">$1</strong>');
}
  // ── Sauvegarder l'état courant ─────────────────────────────────────
  private saveState(): void {
    this.filterState.save({
      selectedRole:        this.selectedRole,
      selectedStatus:      this.selectedStatus,
      showAdvancedFilters: this.showAdvancedFilters,
      filterSexe:          this.filterSexe,
      filterPays:          this.filterPays,
      filterPhone:         this.filterPhone,
      filterNationalite:   this.filterNationalite,
      filterAdresse:       this.filterAdresse,
      filterCodePostal:    this.filterCodePostal,
      filterJobFavori:     this.filterJobFavori,
      filterFonction:      this.filterFonction,
      searchValue:         this.searchControl.value || '',
      page:                this.page,
      limit:               this.limit,
    });
  }

  loadRoles(): void {
    this.roleService.getAll().subscribe({
      next: (backendRoles) => {
        this.roles = [{ value: '', label: 'Tous les rôles' }, ...backendRoles];
      },
      error: () => {
        this.roles = [
          { value: '', label: 'Tous les rôles' },
          { value: 'candidat', label: 'Candidat' },
          { value: 'admin', label: 'Admin' },
          { value: 'company', label: 'Entreprise' }
        ];
      }
    });
  }

  loadUsers(): void {
    this.loading = true;
    const searchTerm = this.searchControl.value?.trim() || undefined;

    this.userService.getAll(
      this.page, this.limit,
      this.selectedRole || undefined,
      searchTerm,
      this.selectedStatus || undefined,
      this.filterSexe || undefined,
      this.filterPays || undefined,
      this.filterNationalite || undefined,
      this.filterFonction || undefined,
      this.filterPhone || undefined,
      this.filterCodePostal || undefined,
      this.filterJobFavori || undefined
    ).subscribe({
      next: (res: any) => {
        this.users = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onFilterChange(): void {
    this.page = 0;
    this.saveState();
    this.loadUsers();
  }

  onTextFilterChange(): void {
    this.textFilter$.next();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
    this.saveState();
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.selectedRole        = 'candidat';
    this.selectedStatus      = '';
    this.filterSexe          = '';
    this.filterPays          = '';
    this.filterPhone         = '';
    this.filterNationalite   = '';
    this.filterAdresse       = '';
    this.filterCodePostal    = '';
    this.filterJobFavori     = '';
    this.filterFonction      = '';
    this.page                = 0;
    this.filterState.clear();
    this.loadUsers();
  }

  onPageChange(event: any): void {
    this.page      = event.pageIndex;
    this.limit     = event.pageSize;
    this.saveState();
    this.loadUsers();
  }

  getStatusLabel(status: string): string {
  const found = this.statuts.find(s => s.value === status);
  return found ? found.label : status;
}
  getRoleLabel(roleValue: string): string {
    const found = this.roles.find(r => r.value === roleValue);
    if (found?.label) return found.label;
    return roleValue ? roleValue.charAt(0).toUpperCase() + roleValue.slice(1) : roleValue;
  }

  deleteUser(id: string): void {
    if (confirm('Confirmer la suppression ?')) {
      this.userService.delete(id).subscribe({ next: () => this.loadUsers() });
    }
  }

  openAddUserDialog(): void {
    const dialogRef = this.dialog.open(UserAddDialogComponent, { width: '600px', disableClose: true });
    dialogRef.afterClosed().subscribe(result => { if (result === 'created') this.loadUsers(); });
  }

  onAvatarError(event: any, user: any): void {
    event.target.style.display = 'none';
    user.photoDeProfile = null;
  }

 openPlatformConfig(): void {
  const usersTabs = [
    { key: 'roles',           label: 'Rôles',          icon: 'badge',   isRoles: true },
    { key: 'fonction',        label: 'Fonctions',      icon: 'work',    system: [] },
    { key: 'statut_candidat', label: 'Statuts',        icon: 'flag',
      system: ['pending', 'rejected', 'accepte'] },
    { key: 'progress_step',   label: 'Étapes',         icon: 'stairs',
      system: ['STEP_1','STEP_2','STEP_3_SUBSTEP_1','STEP_3_SUBSTEP_2',
               'STEP_3_SUBSTEP_3','STEP_3_SUBSTEP_4','STEP_4'] },
  ];

  const dialogRef = this.dialog.open(PlatformConfigDialogComponent, {
    width: '720px',
    maxHeight: '90vh',
    data: { tabs: usersTabs },  // ← passer uniquement les onglets users
  });

  dialogRef.afterClosed().subscribe(() => {
    this.loadRoles();
    this.configService.invalidate('statut_candidat');
    this.configService.getStatuts().subscribe((s: ConfigItem[]) => {
      this.statuts = [
        { id: '', category: '', value: '', label: 'Tous les statuts', order: 0 } as ConfigItem,
        ...s
      ];
    });
  });
}
 getStatusColor(status: string): string {
  const found = this.statuts.find(s => s.value === status) as ConfigItem;
  return this.configService.getStatutClass(found?.color);
}

  
}