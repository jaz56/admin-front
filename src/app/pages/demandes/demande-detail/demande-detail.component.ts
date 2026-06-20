import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { DemandeService } from 'src/app/services/demande.service';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';
import { UserService } from 'src/app/services/user.service';
import { CountryService } from 'src/app/services/country.service';
import { ConfigService, ConfigItem } from 'src/app/services/config.service';
import { forkJoin } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MaterialModule,
    PageHeaderComponent, FormsModule, ReactiveFormsModule,
    MatAutocompleteModule,
  ],
  templateUrl: './demande-detail.component.html',
})
export class DemandeDetailComponent implements OnInit {
  demande: any = null;
  loading = true;
  editMode = false;
  saving = false;
  candidats: any[] = [];
  form!: FormGroup;

  // ── Listes dynamiques ─────────────────────────────────────────────
  statuts:             { value: string; label: string }[] = [];
  typeOptions:         { value: string; label: string }[] = [];
  destinationOptions:  { value: string; label: string }[] = [];
  statutActuelOptions: { value: string; label: string }[] = [];
  fonctionOptions:     { value: string; label: string }[] = [];

  // ── typeLabels pour l'affichage lecture ───────────────────────────
  typeLabels: { [key: string]: string } = {};

  // ── Pays autocomplete ─────────────────────────────────────────────
  allPays:      { value: string; label: string }[] = [];
  filteredPays: { value: string; label: string }[] = [];
  paysSearchText = '';

  // ── Listes statiques ──────────────────────────────────────────────
  readonly niveauEtudeOptions  = ['BEP/CAP', 'Baccalauréat', 'BTS', 'Licence', 'Master', 'Doctorat'];
  readonly experienceOptions   = ['[0-1]', ']1-3]', ']3-5]', ']5-10]', '+10'];
  readonly langueOptions       = ['Français', 'Anglais', 'Espagnol', 'Arabe', 'Allemand', 'Italien', 'Chinois', 'Coréen'];
  readonly niveauLangueOptions = ['Débutant', 'Intermédiaire', 'Avancé', 'Courant', 'Natif'];

  constructor(
    private route:          ActivatedRoute,
    private router:         Router,
    private demandeService: DemandeService,
    private snackBar:       MatSnackBar,
    private userService:    UserService,
    private countryService: CountryService,
    private configService:  ConfigService,
     private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    // ── Charger toutes les listes dynamiques en parallèle ────────────
    forkJoin({
      statuts:        this.configService.get('statut_demande'),
      types:          this.configService.get('type_demande'),
      destinations:   this.configService.get('destination_demande'),
      statutsActuels: this.configService.get('statut_professionnel'),
      fonctions:      this.configService.get('fonction'),
      pays:           this.countryService.getActiveForSelect(),
    }).subscribe({
      next: ({ statuts, types, destinations, statutsActuels, fonctions, pays }) => {
        this.statuts             = statuts.map(s => ({ value: s.value, label: s.label }));
        this.typeOptions         = types.map(t => ({ value: t.value, label: t.label }));
        this.destinationOptions  = destinations.map(d => ({ value: d.value, label: d.label }));
        this.statutActuelOptions = statutsActuels.map(s => ({ value: s.value, label: s.label }));
        this.fonctionOptions     = fonctions.map(f => ({ value: f.value, label: f.label }));
        this.allPays             = pays;
        this.filteredPays        = pays;

        // Construire typeLabels dynamiquement
        this.typeLabels = Object.fromEntries(types.map(t => [t.value, t.label]));
      },
      error: () => {
        // Fallback statique
        this.statuts             = [{ value: 'pre_selection', label: 'Pré-sélection' }, { value: 'selection', label: 'Sélection' }, { value: 'accepte', label: 'Accepté' }, { value: 'refuse', label: 'Refusé' }, { value: 'en_attente', label: 'En attente' }];
        this.typeOptions         = [{ value: 'travail', label: 'Travail' }, { value: 'etude', label: 'Études' }, { value: 'stage', label: 'Stage' }];
        this.destinationOptions  = [{ value: 'journees_france', label: '🇫🇷 France' }, { value: 'journees_canada', label: '🇨🇦 Canada' }, { value: 'journees_allemagne', label: '🇩🇪 Allemagne' }, { value: 'journees_belgique', label: '🇧🇪 Belgique' }];
        this.statutActuelOptions = [{ value: 'employe', label: 'Employé' }, { value: 'chomage', label: 'Sans emploi' }, { value: 'etudiant', label: 'Étudiant' }, { value: 'freelance', label: 'Freelance' }];
        this.fonctionOptions     = [{ value: 'Technique', label: 'Technique' }, { value: 'Commercial', label: 'Commercial' }];
        this.typeLabels          = { travail: 'Travail', etude: 'Études', stage: 'Stage' };
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadDemande(id);
    this.loadCandidats();
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
        paysResidenceValue: found.value,
      });
    }
  }

  clearPays(): void {
    this.paysSearchText = '';
    this.filteredPays   = this.allPays;
    this.form.patchValue({ paysResidenceLabel: '', paysResidenceValue: '' });
  }

 highlightMatch(label: string, term: string): SafeHtml {
  if (!term) return this.sanitizer.bypassSecurityTrustHtml(label);
  const regex = new RegExp(
    `(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'
  );
  const highlighted = label.replace(
    regex, '<strong style="color:#2563eb;">$1</strong>'
  );
  return this.sanitizer.bypassSecurityTrustHtml(highlighted);
}

  // ── Candidats ──────────────────────────────────────────────────────
  loadCandidats(): void {
    this.userService.getAll(0, 1000, 'candidat').subscribe({
      next: (res: any) => { this.candidats = res.data || []; }
    });
  }

  getCandidatLabel(candidat: any): string {
    return `${candidat.prenom || ''} ${candidat.nom || ''} (${candidat.email})`.trim();
  }

  // ── Chargement demande ─────────────────────────────────────────────
  loadDemande(id: string): void {
    this.loading = true;
    this.demandeService.getById(id).subscribe({
      next: (res) => {
        this.demande = res.data;
        this.buildForm();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  buildForm(): void {
    const d = this.demande;

    // Initialiser le pays search text avec la valeur actuelle
    this.paysSearchText = d.paysResidence?.label || '';

    this.form = new FormGroup({
      user:                     new FormControl(d.userId),
      type:                     new FormControl(d.type),
      journeesDestination:      new FormControl(d.journeesDestination),
      paysResidenceValue:       new FormControl(d.paysResidence?.value || ''),
      paysResidenceLabel:       new FormControl(d.paysResidence?.label || ''),
      eligibiliteNote:          new FormControl(d.eligibiliteNote || ''),
      besoinVisa:               new FormControl(d.besoinVisa || false),
      typeHebergement:          new FormControl(d.typeHebergement || false),
      existenceDeGarant:        new FormControl(d.existenceDeGarant || false),
      ouverteTouteOpportunites: new FormControl(d.ouverteTouteOpportunites || false),
      preinscription:           new FormControl(d.preinscription || false),
      maladieContagieuse:       new FormControl(d.maladieContagieuse || false),
      handicape:                new FormControl(d.handicape || false),
      niveauEtude:              new FormControl(d.niveauEtude || ''),
      nombreAnneesEtude:        new FormControl(d.nombreAnneesEtude || 0),
      nombreMoisStage:          new FormControl(d.nombreMoisStage || 0),
      condidatStatutActuel:     new FormControl(d.condidatStatutActuel || ''),
      dernierPosteOccupe:       new FormControl(d.dernierPosteOccupe || ''),
      fonction:                 new FormControl(d.fonction || ''),
      nombreAnneesExperience:   new FormControl(d.nombreAnneesExperience || ''),
      activite:                 new FormControl(d.activite || ''),
      posteSouhaite:            new FormControl(d.posteSouhaite || ''),
      connaissanceLinguistique: new FormControl([...(d.connaissanceLinguistique || [])]),
      diplomes:                 new FormControl([...(d.diplomes || [])]),
      newLangue:                new FormControl(''),
      newNiveau:                new FormControl(''),
      newDiplomeTitre:          new FormControl(''),
      newDiplomeEtablissement:  new FormControl(''),
      newDiplomeDate:           new FormControl(''),
    });
  }

  toggleEdit(): void {
    if (this.editMode) {
      this.buildForm();
      this.paysSearchText = this.demande?.paysResidence?.label || '';
    }
    this.editMode = !this.editMode;
  }

  // ── Langues / Diplômes ─────────────────────────────────────────────
  addLangue(): void {
    const langue = this.form.get('newLangue')?.value;
    const niveau = this.form.get('newNiveau')?.value;
    if (langue && niveau) {
      const list = [...this.form.get('connaissanceLinguistique')?.value];
      list.push({ langue, niveau });
      this.form.patchValue({ connaissanceLinguistique: list, newLangue: '', newNiveau: '' });
    }
  }

  removeLangue(index: number): void {
    const list = [...this.form.get('connaissanceLinguistique')?.value];
    list.splice(index, 1);
    this.form.patchValue({ connaissanceLinguistique: list });
  }

  addDiplome(): void {
    const titre         = this.form.get('newDiplomeTitre')?.value;
    const etablissement = this.form.get('newDiplomeEtablissement')?.value;
    const date          = this.form.get('newDiplomeDate')?.value;
    if (titre && etablissement) {
      const list = [...this.form.get('diplomes')?.value];
      list.push({ titre, etablissement, date });
      this.form.patchValue({ diplomes: list, newDiplomeTitre: '', newDiplomeEtablissement: '', newDiplomeDate: '' });
    }
  }

  removeDiplome(index: number): void {
    const list = [...this.form.get('diplomes')?.value];
    list.splice(index, 1);
    this.form.patchValue({ diplomes: list });
  }

  // ── Sauvegarde ─────────────────────────────────────────────────────
  saveChanges(): void {
    this.saving = true;
    const v = this.form.value;

    const payload = {
      ...this.demande,
      userId:                   v.user,
      type:                     v.type,
      journeesDestination:      v.journeesDestination,
      paysResidence:            { value: v.paysResidenceValue, label: v.paysResidenceLabel },
      eligibiliteNote:          v.eligibiliteNote,
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
      connaissanceLinguistique: v.connaissanceLinguistique,
      diplomes:                 v.diplomes,
    };

    this.demandeService.update(this.demande.id, payload).subscribe({
      next: () => {
        this.saving   = false;
        this.editMode = false;
        this.snackBar.open('Demande mise à jour avec succès !', 'Fermer', { duration: 3000 });
        this.loadDemande(this.demande.id);
      },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
      },
    });
  }

  // ── Statut ─────────────────────────────────────────────────────────
  updateStatus(status: string): void {
    if (!this.demande) return;
    this.demandeService.updateStatus(this.demande.id, status).subscribe({
      next: () => {
        this.demande.status = status;
        this.snackBar.open('Statut mis à jour', 'Fermer', { duration: 2000 });
      },
    });
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      accepte:       'bg-green-100 text-green-700 border-green-200',
      refuse:        'bg-red-100 text-red-700 border-red-200',
      pre_selection: 'bg-blue-100 text-blue-700 border-blue-200',
      selection:     'bg-purple-100 text-purple-700 border-purple-200',
      en_attente:    'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return map[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  }

  getStatusLabel(status: string): string {
    return this.statuts.find(s => s.value === status)?.label || status;
  }

  getBoolIcon(value: boolean): string  { return value ? 'check_circle' : 'cancel'; }
  getBoolColor(value: boolean): string { return value ? 'text-green-500' : 'text-gray-300'; }

  goBack(): void { this.router.navigate(['/demandes']); }

  createBooking(): void {
    this.router.navigate(['/bookings/new'], { queryParams: { demandeId: this.demande.id } });
  }

  get canCreateBooking(): boolean {
    return ['pre_selection', 'accepte'].includes(this.demande?.status);
  }

  get bookingBlockedReason(): string {
    if (this.canCreateBooking) return '';
    return `La demande doit être au statut "Pré-sélection" ou "Accepté" (actuel : ${this.getStatusLabel(this.demande?.status)})`;
  }
}