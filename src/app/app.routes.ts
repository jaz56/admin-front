import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { authGuard, adminGuard  } from './guards/auth.guard';

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