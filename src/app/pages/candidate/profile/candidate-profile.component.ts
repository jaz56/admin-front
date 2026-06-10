import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/services/auth.service';
import { CandidateService } from 'src/app/services/candidate.service';

@Component({
  selector: 'app-candidate-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './candidate-profile.component.html',
})
export class CandidateProfileComponent implements OnInit {
  currentUser: any;
  profile: any = null;
  loading = true;
  activeTab = 0;
  currentTime = new Date();
  passwordVisible = false;
  newPasswordVisible = false;

  // Sécurisation : Champs 'nom' et 'prenom' désactivés à l'initialisation
  profileForm = new FormGroup({
    nom: new FormControl({ value: '', disabled: true }, Validators.required),
    prenom: new FormControl({ value: '', disabled: true }, Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    numeroTel: new FormControl(''),
    address: new FormControl(''),
    codePostal: new FormControl(''),
    fonction: new FormControl(''),
    langueDeProcedure: new FormControl(''),
  });

  passwordForm = new FormGroup({
    currentPassword: new FormControl('', Validators.required),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', Validators.required),
  });

  constructor(
    private authService: AuthService,
    private candidateService: CandidateService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadProfile();
    setInterval(() => this.currentTime = new Date(), 1000);
  }

  loadProfile(): void {
    this.loading = true;
    this.candidateService.getMyProfile().subscribe({
      next: (res) => {
        this.profile = res?.data || null;
        if (this.profile) {
          this.profileForm.patchValue({
            nom: this.profile.nom,
            prenom: this.profile.prenom,
            email: this.profile.email,
            numeroTel: this.profile.numeroTel,
            address: this.profile.address,
            codePostal: this.profile.codePostal,
            fonction: this.profile.fonction,
            langueDeProcedure: this.profile.langueDeProcedure,
          });
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  getInitials(): string {
    const nom = this.profile?.nom || this.currentUser?.nom || '';
    const prenom = this.profile?.prenom || this.currentUser?.prenom || '';
    return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase();
  }

  getCompletionPercentage(): number {
    return this.profile?.profileCompletionPercentage || 0;
  }

  getCompletionColor(): string {
    const pct = this.getCompletionPercentage();
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    
    // Utilisation de getRawValue() pour inclure les champs désactivés (nom/prenom) dans l'envoi
    this.authService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: () => {
        this.snackBar.open('Profil mis à jour !', 'Fermer', { duration: 3000 });
        this.loadProfile();
      },
      error: () => {
        this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
      },
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) return;
    if (this.passwordForm.value.newPassword !== this.passwordForm.value.confirmPassword) {
      this.snackBar.open('Les mots de passe ne correspondent pas', 'Fermer', { duration: 3000 });
      return;
    }
    this.authService.updatePassword({
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword,
    }).subscribe({
      next: () => {
        this.snackBar.open('Mot de passe mis à jour !', 'Fermer', { duration: 3000 });
        this.passwordForm.reset();
      },
      error: (err: any) => {
        this.snackBar.open(
          err.error?.message || 'Erreur lors de la mise à jour',
          'Fermer',
          { duration: 3000 }
        );
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}