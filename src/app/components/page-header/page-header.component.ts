import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface Breadcrumb {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './page-header.component.html',
})
export class PageHeaderComponent implements OnInit {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() alerts: string[] = [];

  breadcrumbs: Breadcrumb[] = [];
  currentDate = new Date();

  private routeLabels: { [key: string]: string } = {
    '': 'Accueil',
    'dashboard': 'Dashboard',
    'users': 'Utilisateurs',
    'demandes': 'Demandes',
    'bookings': 'Bookings',
    'orders': 'Orders',
    'countries': 'Pays',
    'authentication': 'Authentification',
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.buildBreadcrumbs();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.buildBreadcrumbs());
  }

  buildBreadcrumbs(): void {
    const url = this.router.url;
    const segments = url.split('/').filter((s) => s);
    this.breadcrumbs = [
      { label: 'Accueil', url: '/dashboard' },
      ...segments.map((seg, i) => ({
        label: this.routeLabels[seg] || seg,
        url: i < segments.length - 1
          ? '/' + segments.slice(0, i + 1).join('/')
          : undefined,
      })),
    ];
  }
}