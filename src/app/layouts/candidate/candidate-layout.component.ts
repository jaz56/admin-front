import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CandidateHeaderComponent } from './header/candidate-header.component';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-candidate-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, CandidateHeaderComponent, MaterialModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-candidate-header></app-candidate-header>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <router-outlet></router-outlet>
      </main>
      <footer class="text-center py-6 text-sm text-gray-400 border-t border-gray-100 mt-8">
        © 2026 ImmiPro — Plateforme d'Immigration Professionnelle
      </footer>
    </div>
  `,
})
export class CandidateLayoutComponent {}