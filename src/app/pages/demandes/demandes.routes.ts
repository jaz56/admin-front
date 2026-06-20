import { Routes } from '@angular/router';
import { DemandesComponent } from './demandes.component';
import { DemandeDetailComponent } from './demande-detail/demande-detail.component';
import { DemandeCreateComponent } from './demande-create/demande-create.component';

export const DemandesRoutes: Routes = [
  { path: '', component: DemandesComponent },
  { path: 'new', component: DemandeCreateComponent },  // ← MUST be before ':id'
  { path: ':id', component: DemandeDetailComponent },
];