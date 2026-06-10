import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CoreService } from 'src/app/services/core.service';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [RouterModule, MatIconModule],
  template: `
    <a routerLink="/admin/dashboard" class="flex items-center gap-3 no-underline m-2 align-middle">
      
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-sm">
        <mat-icon class="text-white text-lg!">flight_takeoff</mat-icon>
      </div>

      <div class="hide-menu">
        <p class="text-base font-bold text-gray-800 m-0 leading-tight">ImmiPro</p>
        <p class="text-xs text-gray-400 m-0 mt-0.5">Portail Admin</p>
      </div>

    </a>
  `,
})
export class BrandingComponent {
  options = this.settings.getOptions();
  constructor(private settings: CoreService) { }
}