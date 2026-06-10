import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';

import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexLegend,
  ApexDataLabels,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexPlotOptions,
} from 'ng-apexcharts';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-starter',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, NgApexchartsModule,PageHeaderComponent],
  templateUrl: './starter.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class StarterComponent implements OnInit {
  stats: DashboardStats = {
    totalUsers: 0,
    totalDemandes: 0,
    totalBookings: 0,
    totalRevenue: 0,
    demandesByStatus: {},
    recentUsers: [],
  };

  loading = true;
  currentUser: any;
dashboardAlerts: string[] = [];
  // Camembert
  pieChartSeries: ApexNonAxisChartSeries = [];
  pieChartOptions: ApexChart = { type: 'donut', height: 280 };
  pieChartLabels: string[] = [];
  pieChartLegend: ApexLegend = { position: 'bottom' };
  pieChartDataLabels: ApexDataLabels = { enabled: true };
  pieChartColors: string[] = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

  // Barres
  barChartSeries: ApexAxisChartSeries = [];
  barChartOptions: ApexChart = { type: 'bar', height: 280, toolbar: { show: false } };
  barChartXAxis: ApexXAxis = { categories: [] };
  barChartPlotOptions: ApexPlotOptions = {
    bar: { borderRadius: 6, columnWidth: '50%' },
  };
  barChartColors: string[] = ['#6366f1'];

  cards = [
    {
      title: 'Utilisateurs',
      key: 'totalUsers',
      icon: 'people',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      route: '/users',
      isCurrency: false,
    },
    {
      title: 'Demandes',
      key: 'totalDemandes',
      icon: 'description',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      route: '/demandes',
      isCurrency: false,
    },
    {
      title: 'Bookings',
      key: 'totalBookings',
      icon: 'calendar_today',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
      route: '/bookings',
      isCurrency: false,
    },
    {
      title: "Chiffre d'affaires",
      key: 'totalRevenue',
      icon: 'payments',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      route: '/orders',
      isCurrency: true,
    },
  ];

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    forkJoin({
      stats: this.dashboardService.getStats(),
      recentUsers: this.dashboardService.getRecentUsers(),
    }).subscribe({
      next: ({ stats, recentUsers }) => {
        this.stats = { ...stats, recentUsers };
        this.buildCharts();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  buildCharts(): void {
    const statusLabels: { [key: string]: string } = {
      pre_selection: 'Pré-sélection',
      selection: 'Sélection',
      accepte: 'Accepté',
      refuse: 'Refusé',
      en_attente: 'En attente',
    };

    const entries = Object.entries(this.stats.demandesByStatus);
    this.pieChartLabels = entries.map(([key]) => statusLabels[key] || key);
    this.pieChartSeries = entries.map(([, value]) => value);
    this.barChartXAxis = {
      categories: entries.map(([key]) => statusLabels[key] || key),
    };
    this.barChartSeries = [
      {
        name: 'Demandes',
        data: entries.map(([, value]) => value),
      },
    ];
    this.buildAlerts();
  }
buildAlerts(): void {
  this.dashboardAlerts = [];
  const pending = this.stats.demandesByStatus['en_attente'] || 0;
  const preSelection = this.stats.demandesByStatus['pre_selection'] || 0;
  if (pending > 0) {
    this.dashboardAlerts.push(
      `${pending} demande(s) en attente de traitement`
    );
  }
  if (preSelection > 0) {
    this.dashboardAlerts.push(
      `${preSelection} demande(s) en pré-sélection à valider`
    );
  }
}
  getStatValue(key: string): any {
    return (this.stats as any)[key] || 0;
  }

  getVerificationClass(status: string): string {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getVerificationLabel(status: string): string {
    switch (status) {
      case 'verified': return 'Vérifié';
      case 'pending': return 'En attente';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  }
}