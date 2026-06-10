import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { CandidateService } from 'src/app/services/candidate.service'; // 🎯 Ajout de l'import

@Component({
  selector: 'app-candidate-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './candidate-header.component.html',
})
export class CandidateHeaderComponent implements OnInit {
  currentUser: any;
  menuOpen = false;
  unreadCount = 0; // 🎯 Stocke le nombre de notifications non lues

  // 🎯 Nettoyage du menu : On garde uniquement les liens structurels
  navLinks = [
    { label: 'Tableau de bord', route: '/candidate/dashboard', icon: 'dashboard' },
    { label: 'Ma Demande', route: '/candidate/demande', icon: 'description' },
    { label: 'Mon Booking', route: '/candidate/booking', icon: 'calendar_today' },
  ];

  // 🎯 Injection du CandidateService dans le constructeur
  constructor(
    private authService: AuthService,
    private candidateService: CandidateService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUnreadCount(); // 🎯 Chargement des notifications à l'initialisation
  }

  /**
   * Récupère les notifications du candidat et compte celles qui ne sont pas lues
   */
  loadUnreadCount(): void {
    this.candidateService.getMyNotifications().subscribe({
      next: (res) => {
        // Filtre les notifications là où read === false
        const notifications = res?.data || [];
        this.unreadCount = notifications.filter((n: any) => !n.read).length;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des compteurs de notifications', err);
        this.unreadCount = 0;
      }
    });
  }

  getInitials(): string {
    if (!this.currentUser) return 'C';
    const nom = this.currentUser.nom?.charAt(0) || '';
    const prenom = this.currentUser.prenom?.charAt(0) || '';
    return `${nom}${prenom}`.toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}