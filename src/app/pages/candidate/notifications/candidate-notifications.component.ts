import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CandidateService } from 'src/app/services/candidate.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-candidate-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './candidate-notifications.component.html',
})
export class CandidateNotificationsComponent implements OnInit {
  loading = true;
  filter = 'all';
  notifications: any[] = [];

  filters = [
    { value: 'all', label: 'Toutes', count: 0 },
    { value: 'unread', label: 'Non lues', count: 0 },
    { value: 'SUCCESS', label: 'Succès', count: 0 },
    { value: 'INFO', label: 'Infos', count: 0 },
    { value: 'WARNING', label: 'Alertes', count: 0 },
  ];

  constructor(
    private candidateService: CandidateService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.candidateService.getMyNotifications().subscribe({
      next: (res) => {
        this.notifications = res?.data || [];
        this.updateCounts();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement des notifications', 'Fermer', { duration: 3000 });
      }
    });
  }

  updateCounts(): void {
    this.filters[0].count = this.notifications.length;
    this.filters[1].count = this.notifications.filter(n => !n.read).length;
    this.filters[2].count = this.notifications.filter(n => n.type === 'SUCCESS').length;
    this.filters[3].count = this.notifications.filter(n => n.type === 'INFO').length;
    this.filters[4].count = this.notifications.filter(n => n.type === 'WARNING').length;
  }

  get filteredNotifications() {
    if (this.filter === 'all') return this.notifications;
    if (this.filter === 'unread') return this.notifications.filter(n => !n.read);
    return this.notifications.filter(n => n.type === this.filter);
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Mappage dynamique UI basé sur le type du backend
  getUiConfig(type: string) {
    switch (type) {
      case 'SUCCESS':
        return { icon: 'check_circle', color: 'bg-green-100 text-green-600' };
      case 'WARNING':
        return { icon: 'warning', color: 'bg-yellow-100 text-yellow-600' };
      case 'PURPLE':
        return { icon: 'calendar_today', color: 'bg-purple-100 text-purple-600' };
      case 'TEAL':
        return { icon: 'payments', color: 'bg-teal-100 text-teal-600' };
      case 'INFO':
      default:
        return { icon: 'info', color: 'bg-blue-100 text-blue-600' };
    }
  }

  markAsRead(notification: any): void {
    this.candidateService.markNotificationAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.updateCounts();
      }
    });
  }

  markAllAsRead(): void {
    this.candidateService.markAllNotificationsAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);
        this.updateCounts();
        this.snackBar.open('Toutes les notifications ont été lues', 'Fermer', { duration: 2000 });
      }
    });
  }

  deleteNotification(id: string): void {
    this.candidateService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.updateCounts();
        this.snackBar.open('Notification supprimée', 'Fermer', { duration: 2000 });
      }
    });
  }
}