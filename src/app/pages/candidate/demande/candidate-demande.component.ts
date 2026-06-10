import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CandidateService } from 'src/app/services/candidate.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-candidate-demande',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './candidate-demande.component.html',
})
export class CandidateDemandeComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  loading = false;
  saving = false;
  existingDemande: any = null;

  // ── Étape 1 : Infos personnelles ──
  step1Form = new FormGroup({
    type: new FormControl('travail', Validators.required),
    journeesDestination: new FormControl('', Validators.required),
    paysResidenceValue: new FormControl('', Validators.required),
    paysResidenceLabel: new FormControl(''),
    besoinVisa: new FormControl(false),
    typeHebergement: new FormControl(false),
    maladieContagieuse: new FormControl(false),
    handicape: new FormControl(false),
    existenceDeGarant: new FormControl(false),
    ouverteTouteOpportunites: new FormControl(false),
  });

  // ── Étape 2 : Parcours professionnel ──
  step2Form = new FormGroup({
    niveauEtude: new FormControl('', Validators.required),
    nombreAnneesEtude: new FormControl(0),
    nombreMoisStage: new FormControl(0),
    condidatStatutActuel: new FormControl('', Validators.required),
    dernierPosteOccupe: new FormControl(''),
    fonction: new FormControl('', Validators.required),
    nombreAnneesExperience: new FormControl(''),
    posteSouhaite: new FormControl('', Validators.required),
    activite: new FormControl(''),
  });

  // ── Étape 3 : Langues & Diplômes ──
  step3Form = new FormGroup({
    langue: new FormControl(''),
    niveau: new FormControl(''),
    titreDiplome: new FormControl(''),
    etablissement: new FormControl(''),
    dateDiplome: new FormControl(''),
  });

  diplomes: any[] = [];
  langues: any[] = [];

  // Options
  typeOptions = [
    { value: 'travail', label: 'Travail' },
    { value: 'etude', label: 'Études' },
    { value: 'stage', label: 'Stage' },
  ];

  destinationOptions = [
    { value: 'journees_france', label: 'Journées France' },
    { value: 'journees_canada', label: 'Journées Canada' },
    { value: 'journees_belgique', label: 'Journées Belgique' },
    { value: 'journees_allemagne', label: 'Journées Allemagne' },
  ];

  niveauEtudeOptions = [
    'BEP/CAP', 'Baccalauréat', 'BTS', 'Licence', 'Master', 'Doctorat',
  ];

  statutOptions = [
    { value: 'employe', label: 'Employé' },
    { value: 'chomage', label: 'Sans emploi' },
    { value: 'etudiant', label: 'Étudiant' },
    { value: 'freelance', label: 'Freelance' },
  ];

  fonctionOptions = [
    'Technique', 'Commercial', 'Marketing', 'Finance',
    'RH', 'Juridique', 'Santé', 'Éducation', 'Autre',
  ];

  experienceOptions = [
    '[0-1]', ']1-3]', ']3-5]', ']5-10]', '+10',
  ];

  langueOptions = [
    'Français', 'Anglais', 'Espagnol', 'Arabe',
    'Allemand', 'Italien', 'Chinois', 'Coréen',
  ];

  niveauLangueOptions = [
    'Débutant', 'Intermédiaire', 'Avancé', 'Courant', 'Natif',
  ];

  constructor(
    private candidateService: CandidateService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadExistingDemande();
  }

  loadExistingDemande(): void {
    this.loading = true;
    this.candidateService.getMyDemande().subscribe({
      next: (res) => {
        this.existingDemande = res?.data || null;
        if (this.existingDemande) {
          this.prefillForms();
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  prefillForms(): void {
    const d = this.existingDemande;
    this.step1Form.patchValue({
      type: d.type,
      journeesDestination: d.journeesDestination,
      paysResidenceValue: d.paysResidence?.value,
      paysResidenceLabel: d.paysResidence?.label,
      besoinVisa: d.besoinVisa,
      typeHebergement: d.typeHebergement,
      maladieContagieuse: d.maladieContagieuse,
      handicape: d.handicape,
      existenceDeGarant: d.existenceDeGarant,
      ouverteTouteOpportunites: d.ouverteTouteOpportunites,
    });
    this.step2Form.patchValue({
      niveauEtude: d.niveauEtude,
      nombreAnneesEtude: d.nombreAnneesEtude,
      nombreMoisStage: d.nombreMoisStage,
      condidatStatutActuel: d.condidatStatutActuel,
      dernierPosteOccupe: d.dernierPosteOccupe,
      fonction: d.fonction,
      nombreAnneesExperience: d.nombreAnneesExperience,
      posteSouhaite: d.posteSouhaite,
      activite: d.activite,
    });
    this.diplomes = d.diplomes || [];
    this.langues = d.connaissanceLinguistique || [];
  }

  addLangue(): void {
    const langue = this.step3Form.get('langue')?.value;
    const niveau = this.step3Form.get('niveau')?.value;
    if (langue && niveau) {
      this.langues.push({ langue, niveau });
      this.step3Form.patchValue({ langue: '', niveau: '' });
    }
  }

  removeLangue(index: number): void {
    this.langues.splice(index, 1);
  }

  addDiplome(): void {
    const titre = this.step3Form.get('titreDiplome')?.value;
    const etablissement = this.step3Form.get('etablissement')?.value;
    const date = this.step3Form.get('dateDiplome')?.value;
    if (titre && etablissement) {
      this.diplomes.push({ titre, etablissement, date });
      this.step3Form.patchValue({
        titreDiplome: '', etablissement: '', dateDiplome: '',
      });
    }
  }

  removeDiplome(index: number): void {
    this.diplomes.splice(index, 1);
  }

submitDemande(): void {
    this.saving = true;

    // 1. On extrait les valeurs qui ne doivent pas aller à la racine du JSON
    const { paysResidenceValue, paysResidenceLabel, ...cleanStep1Data } = this.step1Form.value;

    // 2. On construit le payload propre
    const payload = {
      ...cleanStep1Data,
      ...this.step2Form.value,
      paysResidence: {
        value: paysResidenceValue,
        label: paysResidenceLabel,
      },
      diplomes: this.diplomes,
      connaissanceLinguistique: this.langues,
    };

    const request$ = this.existingDemande
      ? this.http.put(`${environment.apiUrl}/demandes/${this.existingDemande.id}`, payload)
      : this.http.post(`${environment.apiUrl}/demandes`, payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open(
          this.existingDemande ? 'Dossier mis à jour avec succès !' : 'Dossier soumis avec succès !',
          'Fermer',
          { duration: 4000 }
        );
        this.loadExistingDemande();
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Erreur lors de la soumission', 'Fermer', { duration: 3000 });
      },
    });
  }
}