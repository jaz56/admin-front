import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent {
  loading = false;
  errorMessage = '';
  passwordVisible = false;

  constructor(private authService: AuthService) {}

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  get f() { return this.form.controls; }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    this.authService.login({
      email: this.f['email'].value!,
      password: this.f['password'].value!,
    }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          // Redirection automatique selon le rôle
          this.authService.redirectAfterLogin();
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Email ou mot de passe incorrect';
      },
    });
  }
}