import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CandidateService } from 'src/app/services/candidate.service';
import { AuthService } from 'src/app/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-candidate-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './candidate-dashboard.component.html',
})
export class CandidateDashboardComponent implements OnInit {
  currentUser: any;
  demande: any = null;
  booking: any = null;
  loading = true;

  // Étapes du workflow candidat
  steps = [
    {
      id: 1,
      label: 'Inscription',
      description: 'Création du compte',
      icon: 'person_add',
      status: 'completed',
    },
    {
      id: 2,
      label: 'Dossier',
      description: 'Soumettre votre candidature',
      icon: 'description',
      status: 'pending',
    },
    {
      id: 3,
      label: 'Pré-sélection',
      description: 'Examen par nos équipes',
      icon: 'manage_search',
      status: 'locked',
    },
    {
      id: 4,
      label: 'Entretien',
      description: 'Réserver votre session',
      icon: 'video_call',
      status: 'locked',
    },
    {
      id: 5,
      label: 'Décision',
      description: 'Résultat final',
      icon: 'verified',
      status: 'locked',
    },
  ];

  quickActions = [
    {
      label: 'Compléter mon dossier',
      description: 'Remplissez votre candidature',
      icon: 'edit_document',
      route: '/candidate/demande',
      color: 'from-blue-500 to-blue-600',
      show: true,
    },
    {
      label: 'Réserver un entretien',
      description: 'Choisissez votre créneau',
      icon: 'calendar_month',
      route: '/candidate/booking',
      color: 'from-purple-500 to-purple-600',
      show: false,
    },
    {
      label: 'Mon profil',
      description: 'Mettre à jour mes infos',
      icon: 'manage_accounts',
      route: '/candidate/profile',
      color: 'from-teal-500 to-teal-600',
      show: true,
    },
  ];

  constructor(
    private candidateService: CandidateService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      demande: this.candidateService.getMyDemande(),
      booking: this.candidateService.getMyBooking(),
    }).subscribe({
      next: ({ demande, booking }) => {
        this.demande = demande?.data || null;
        this.booking = booking?.data || null;
        this.updateSteps();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.updateSteps();
      },
    });
  }

  updateSteps(): void {
    // Étape 1 — toujours complétée (compte créé)
    this.steps[0].status = 'completed';

    // Étape 2 — dossier
    if (this.demande) {
      this.steps[1].status = 'completed';
    } else {
      this.steps[1].status = 'active';
    }

    // Étape 3 — pré-sélection
    if (this.demande?.status === 'pre_selection' ||
        this.demande?.status === 'selection' ||
        this.demande?.status === 'accepte') {
      this.steps[2].status = 'completed';
    } else if (this.demande) {
      this.steps[2].status = 'pending';
    }

    // Étape 4 — entretien/booking
    if (this.booking) {
      this.steps[3].status = 'completed';
      this.quickActions[1].show = true;
    } else if (this.demande?.status === 'pre_selection') {
      this.steps[3].status = 'active';
      this.quickActions[1].show = true;
    }

    // Étape 5 — décision
    if (this.demande?.status === 'accepte' ||
        this.demande?.status === 'refuse') {
      this.steps[4].status = 'completed';
    }

    // Masquer "Compléter dossier" si déjà fait
    if (this.demande) {
      this.quickActions[0].show = false;
    }
  }

  getStepClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'active': return 'bg-blue-500 text-white ring-4 ring-blue-100';
      case 'pending': return 'bg-yellow-400 text-white';
      case 'locked': return 'bg-gray-200 text-gray-400';
      default: return 'bg-gray-200 text-gray-400';
    }
  }

  getStepLineClass(index: number): string {
    const status = this.steps[index]?.status;
    return status === 'completed' ? 'bg-green-400' : 'bg-gray-200';
  }

  getDemandeStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pre_selection: 'Pré-sélection',
      selection: 'Sélection',
      accepte: 'Accepté ✓',
      refuse: 'Non retenu',
      en_attente: 'En attente',
    };
    return labels[status] || status;
  }

  getDemandeStatusClass(status: string): string {
    switch (status) {
      case 'accepte': return 'bg-green-100 text-green-700 border-green-200';
      case 'refuse': return 'bg-red-100 text-red-700 border-red-200';
      case 'pre_selection': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'selection': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }
}