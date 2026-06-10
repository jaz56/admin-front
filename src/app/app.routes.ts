import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { CandidateLayoutComponent } from './layouts/candidate/candidate-layout.component';
import { authGuard, adminGuard, candidateGuard } from './guards/auth.guard';

export const routes: Routes = [
  // ── Layout Admin ──────────────────────────────────────
  {
    path: '',
    component: FullComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./pages/users/users.routes').then((m) => m.UsersRoutes),
      },
      {
        path: 'demandes',
        loadChildren: () =>
          import('./pages/demandes/demandes.routes').then((m) => m.DemandesRoutes),
      },
      {
        path: 'bookings',
        loadChildren: () =>
          import('./pages/bookings/bookings.routes').then((m) => m.BookingsRoutes),
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('./pages/orders/orders.routes').then((m) => m.OrdersRoutes),
      },
      {
        path: 'countries',
        loadChildren: () =>
          import('./pages/countries/countries.routes').then((m) => m.CountriesRoutes),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./pages/profile/profile.routes').then((m) => m.ProfileRoutes),
      },
    ],
  },

  // ── Layout Candidat ───────────────────────────────────
  {
    path: 'candidate',
    component: CandidateLayoutComponent,
    canActivate: [authGuard, candidateGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/candidate/dashboard/candidate-dashboard.routes')
            .then((m) => m.CandidateDashboardRoutes),
      },
      {
        path: 'demande',
        loadChildren: () =>
          import('./pages/candidate/demande/candidate-demande.routes')
            .then((m) => m.CandidateDemandeRoutes),
      },
      {
        path: 'booking',
        loadChildren: () =>
          import('./pages/candidate/booking/candidate-booking.routes')
            .then((m) => m.CandidateBookingRoutes),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./pages/candidate/profile/candidate-profile.routes')
            .then((m) => m.CandidateProfileRoutes),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./pages/candidate/notifications/candidate-notifications.routes')
            .then((m) => m.CandidateNotificationsRoutes),
      },
    ],
  },

  // ── Auth ──────────────────────────────────────────────
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes')
            .then((m) => m.AuthenticationRoutes),
      },
    ],
  },
  { path: '**', redirectTo: 'authentication/error' },
];