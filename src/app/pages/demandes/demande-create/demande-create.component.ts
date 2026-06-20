import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { DemandeService } from 'src/app/services/demande.service';
import { UserService } from 'src/app/services/user.service';
import { CountryService } from 'src/app/services/country.service';
import { ConfigService, ConfigItem } from 'src/app/services/config.service';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-demande-create',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MaterialModule,
    FormsModule, ReactiveFormsModule,
    MatAutocompleteModule,
    PageHeaderComponent
  ],
  templateUrl: './demande-create.component.html',
})
export class DemandeCreateComponent implements OnInit {
  saving = false;
  users: any[] = [];
  loadingUsers = true;
  preselectedUser: any = null;
  fromUserDetail = false;
  diplomes: any[] = [];
  langues: any[] = [];
  filteredUsers: any[] = [];
  userSearchDisplay = '';

  // ── Listes dynamiques ─────────────────────────────────────────────
  typeOptions:         { value: string; label: string }[] = [];
  statutOptions:       { value: string; label: string }[] = [];
  statutActuelOptions: { value: string; label: string }[] = [];
  destinationOptions:  { value: string; label: string }[] = [];
  fonctionOptions:     { value: string; label: string }[] = [];

  // ── Pays avec autocomplete ────────────────────────────────────────
  allPays:        { value: string; label: string }[] = [];
  filteredPays:   { value: string; label: string }[] = [];
  paysSearchText = '';

  // ── Listes statiques ──────────────────────────────────────────────
  readonly niveauEtudeOptions  = ['BEP/CAP', 'Baccalauréat', 'BTS', 'Licence', 'Master', 'Doctorat'];
  readonly experienceOptions   = ['[0-1]', ']1-3]', ']3-5]', ']5-10]', '+10'];
  readonly langueOptions       = ['Français', 'Anglais', 'Espagnol', 'Arabe', 'Allemand', 'Italien', 'Chinois', 'Coréen'];
  readonly niveauLangueOptions = ['Débutant', 'Intermédiaire', 'Avancé', 'Courant', 'Natif'];

  form = new FormGroup({
    userId:                   new FormControl('', Validators.required),
    type:                     new FormControl('', Validators.required),
    status:                   new FormControl('en_attente', Validators.required),
    journeesDestination:      new FormControl('', Validators.required),
    paysResidenceValue:       new FormControl('', Validators.required),
    paysResidenceLabel:       new FormControl('', Validators.required),
    eligibiliteNote:          new FormControl(''),
    besoinVisa:               new FormControl(false),
    typeHebergement:          new FormControl(false),
    existenceDeGarant:        new FormControl(false),
    ouverteTouteOpportunites: new FormControl(false),
    preinscription:           new FormControl(false),
    maladieContagieuse:       new FormControl(false),
    handicape:                new FormControl(false),
    niveauEtude:              new FormControl('', Validators.required),
    nombreAnneesEtude:        new FormControl(0),
    nombreMoisStage:          new FormControl(0),
    condidatStatutActuel:     new FormControl('', Validators.required),
    dernierPosteOccupe:       new FormControl(''),
    fonction:                 new FormControl('', Validators.required),
    nombreAnneesExperience:   new FormControl(''),
    activite:                 new FormControl(''),
    posteSouhaite:            new FormControl('', Validators.required),
    newLangue:                new FormControl(''),
    newNiveau:                new FormControl(''),
    newDiplomeTitre:          new FormControl(''),
    newDiplomeEtablissement:  new FormControl(''),
    newDiplomeDate:           new FormControl(''),
  });

  constructor(
    private route:          ActivatedRoute,
    private demandeService: DemandeService,
    private userService:    UserService,
    private countryService: CountryService,
    private configService:  ConfigService,
    private router:         Router,
    private snackBar:       MatSnackBar,
  ) {}

  ngOnInit(): void {
    // ── Charger toutes les listes dynamiques en parallèle ────────────
    forkJoin({
      types:        this.configService.get('type_demande'),
      statuts:      this.configService.get('statut_demande'),
      statutsActuels: this.configService.get('statut_professionnel'),
      destinations: this.configService.get('destination_demande'),
      fonctions:    this.configService.get('fonction'),
      pays:         this.countryService.getActiveForSelect(),
    }).subscribe({
      next: ({ types, statuts, statutsActuels, destinations, fonctions, pays }) => {
        this.typeOptions         = types.map(t => ({ value: t.value, label: t.label }));
        this.statutOptions       = statuts.map(s => ({ value: s.value, label: s.label }));
        this.statutActuelOptions = statutsActuels.map(s => ({ value: s.value, label: s.label }));
        this.destinationOptions  = destinations.map(d => ({ value: d.value, label: d.label }));
        this.fonctionOptions     = fonctions.map(f => ({ value: f.value, label: f.label }));
        this.allPays             = pays;
        this.filteredPays        = pays;

        // Valeur par défaut après chargement
        if (this.typeOptions.length)   this.form.patchValue({ type: this.typeOptions[0].value });
        if (this.statutOptions.length) this.form.patchValue({ status: this.statutOptions.find(s => s.value === 'en_attente')?.value || this.statutOptions[0].value });
      },
      error: () => {
        // Fallback statique
        this.typeOptions         = [{ value: 'travail', label: 'Travail' }, { value: 'etude', label: 'Études' }, { value: 'stage', label: 'Stage' }];
        this.statutOptions       = [{ value: 'en_attente', label: 'En attente' }, { value: 'pre_selection', label: 'Pré-sélection' }];
        this.statutActuelOptions = [{ value: 'employe', label: 'Employé' }, { value: 'chomage', label: 'Sans emploi' }, { value: 'etudiant', label: 'Étudiant' }, { value: 'freelance', label: 'Freelance' }];
        this.destinationOptions  = [{ value: 'journees_france', label: '🇫🇷 France' }, { value: 'journees_canada', label: '🇨🇦 Canada' }];
        this.fonctionOptions     = [{ value: 'Technique', label: 'Technique' }, { value: 'Commercial', label: 'Commercial' }];
      }
    });

    // ── Gestion du userId passé en query param ───────────────────────
    const userId = this.route.snapshot.queryParamMap.get('userId');
    if (userId) {
      this.fromUserDetail = true;
      this.form.patchValue({ userId });
      this.loadingUsers = false;
      this.loadPreselectedUser(userId);
    } else {
      this.loadUsers();
    }
  }

  // ── Pays autocomplete ──────────────────────────────────────────────
  onPaysSearch(): void {
    const term = this.paysSearchText.toLowerCase().trim();
    this.filteredPays = term
      ? this.allPays.filter(p =>
          p.label.toLowerCase().includes(term) ||
          p.value.toLowerCase().includes(term)
        ).slice(0, 10)
      : this.allPays;
  }

  onPaysSelected(event: MatAutocompleteSelectedEvent): void {
    const label = event.option.value as string;
    const found = this.allPays.find(p => p.label === label);
    if (found) {
      this.paysSearchText = found.label;
      this.form.patchValue({
        paysResidenceLabel: found.label,
        paysResidenceValue: found.value,   // ← code pays rempli automatiquement
      });
    }
  }

  clearPays(): void {
    this.paysSearchText = '';
    this.filteredPays   = this.allPays;
    this.form.patchValue({ paysResidenceLabel: '', paysResidenceValue: '' });
  }

  highlightMatch(label: string, term: string): string {
    if (!term) return label;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return label.replace(regex, '<strong style="color:#2563eb;">$1</strong>');
  }

  // ── Utilisateurs ───────────────────────────────────────────────────
  loadPreselectedUser(id: string): void {
    this.userService.getById(id).subscribe({
      next: (res: any) => { this.preselectedUser = res.data; }
    });
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.userService.getAll(0, 1000, 'candidat').subscribe({
      next: (res) => {
        this.users        = res.data || [];
        this.filteredUsers = [];
        this.loadingUsers  = false;
      },
      error: () => { this.loadingUsers = false; },
    });
  }

  onUserSearch(query: string): void {
    const q = (query || '').toLowerCase().trim();
    this.filteredUsers = q.length === 0
      ? []
      : this.users.filter(u =>
          `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(q)
        ).slice(0, 10);
  }

  selectUser(user: any): void {
    this.form.patchValue({ userId: user.id });
    this.userSearchDisplay = this.getUserLabel(user);
    this.filteredUsers     = [];
  }

  clearSelectedUser(): void {
    this.form.patchValue({ userId: '' });
    this.userSearchDisplay = '';
  }

  getUserLabel(u: any): string {
    return `${u.nom} ${u.prenom} — ${u.email}`;
  }

  // ── Langues / Diplômes ─────────────────────────────────────────────
  addLangue(): void {
    const langue = this.form.get('newLangue')?.value;
    const niveau = this.form.get('newNiveau')?.value;
    if (langue && niveau) {
      this.langues.push({ langue, niveau });
      this.form.patchValue({ newLangue: '', newNiveau: '' });
    }
  }

  removeLangue(i: number): void { this.langues.splice(i, 1); }

  addDiplome(): void {
    const titre         = this.form.get('newDiplomeTitre')?.value;
    const etablissement = this.form.get('newDiplomeEtablissement')?.value;
    const date          = this.form.get('newDiplomeDate')?.value;
    if (titre && etablissement) {
      this.diplomes.push({ titre, etablissement, date });
      this.form.patchValue({ newDiplomeTitre: '', newDiplomeEtablissement: '', newDiplomeDate: '' });
    }
  }

  removeDiplome(i: number): void { this.diplomes.splice(i, 1); }

  // ── Submit ─────────────────────────────────────────────────────────
  submit(): void {
    if (this.form.invalid) {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
      return;
    }
    this.saving = true;
    const v = this.form.value;

    const payload = {
      user:                     v.userId,
      type:                     v.type,
      status:                   v.status,
      journeesDestination:      v.journeesDestination,
      eligibiliteNote:          v.eligibiliteNote,
      paysResidence:            { value: v.paysResidenceValue, label: v.paysResidenceLabel },
      besoinVisa:               v.besoinVisa,
      typeHebergement:          v.typeHebergement,
      existenceDeGarant:        v.existenceDeGarant,
      ouverteTouteOpportunites: v.ouverteTouteOpportunites,
      preinscription:           v.preinscription,
      maladieContagieuse:       v.maladieContagieuse,
      handicape:                v.handicape,
      niveauEtude:              v.niveauEtude,
      nombreAnneesEtude:        v.nombreAnneesEtude,
      nombreMoisStage:          v.nombreMoisStage,
      condidatStatutActuel:     v.condidatStatutActuel,
      dernierPosteOccupe:       v.dernierPosteOccupe,
      fonction:                 v.fonction,
      nombreAnneesExperience:   v.nombreAnneesExperience,
      activite:                 v.activite,
      posteSouhaite:            v.posteSouhaite,
      diplomes:                 this.diplomes,
      connaissanceLinguistique: this.langues,
    };

    this.demandeService.createAsAdmin(payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.snackBar.open('Demande créée avec succès !', 'Fermer', { duration: 3000 });
        const newId = res?.data?.id;
        this.router.navigate(newId ? ['/demandes', newId] : ['/demandes']);
      },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Erreur lors de la création', 'Fermer', { duration: 3000 });
      },
    });
  }

  cancel(): void {
    this.fromUserDetail
      ? this.router.navigate(['/users', this.form.value.userId])
      : this.router.navigate(['/demandes']);
  }
}