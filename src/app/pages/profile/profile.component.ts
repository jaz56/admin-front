import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  currentUser: any;
  activeTab = 0;
  currentTime = new Date();
  passwordVisible = false;
  newPasswordVisible = false;
  saveSuccess = false;

  // Sécurisation : 'nom' et 'prenom' passés en disabled: true dès le départ
  profileForm = new FormGroup({
    nom: new FormControl({ value: '', disabled: true }, Validators.required),
    prenom: new FormControl({ value: '', disabled: true }, Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    role: new FormControl({ value: '', disabled: true }),
  });

  passwordForm = new FormGroup({
    currentPassword: new FormControl('', Validators.required),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', Validators.required),
  });

  stats = [
    { label: 'Sessions', value: '1', icon: 'login', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Dernière connexion', value: "Aujourd'hui", icon: 'schedule', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Rôle', value: 'Admin', icon: 'shield', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Statut', value: 'Actif', icon: 'verified', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  activities = [
    { action: 'Connexion au dashboard', time: 'Il y a 2 minutes', icon: 'login', color: 'bg-blue-100 text-blue-600' },
    { action: 'Consultation liste utilisateurs', time: 'Il y a 5 minutes', icon: 'people', color: 'bg-purple-100 text-purple-600' },
    { action: 'Mise à jour statut demande', time: 'Il y a 1 heure', icon: 'edit', color: 'bg-green-100 text-green-600' },
    { action: 'Validation booking #BK000001', time: 'Hier à 14:30', icon: 'calendar_today', color: 'bg-orange-100 text-orange-600' },
    { action: 'Consultation dashboard', time: 'Hier à 09:15', icon: 'dashboard', color: 'bg-teal-100 text-teal-600' },
  ];

  constructor(private authService: AuthService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.profileForm.patchValue({
        nom: this.currentUser.nom,
        prenom: this.currentUser.prenom,
        email: this.currentUser.email,
        role: this.currentUser.role,
      });
      this.stats[2].value = this.currentUser.role;
    }
    setInterval(() => this.currentTime = new Date(), 1000);
  }

  getInitials(): string {
    if (!this.currentUser) return 'A';
    return `${this.currentUser.nom?.charAt(0) || ''}${this.currentUser.prenom?.charAt(0) || ''}`.toUpperCase();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    
    // getRawValue() permet d'extraire tout le modèle, y compris les contrôles désactivés
    this.authService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (res) => {
        this.currentUser = this.authService.getCurrentUser(); // Rafraîchir les données
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
      error: (err) => {
        this.snackBar.open('Erreur lors de la mise à jour du profil', 'Fermer', { duration: 3000 });
      }
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) return;

    if (this.passwordForm.value.newPassword !== this.passwordForm.value.confirmPassword) {
      this.snackBar.open('Les nouveaux mots de passe ne correspondent pas', 'Fermer', { duration: 3000 });
      return;
    }

    const payload = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.authService.updatePassword(payload).subscribe({
      next: () => {
        this.snackBar.open('Mot de passe mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.passwordForm.reset();
      },
      error: (err) => {
        const msg = err.error?.message || 'Erreur lors de la mise à jour du mot de passe';
        this.snackBar.open(msg, 'Fermer', { duration: 3000 });
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}