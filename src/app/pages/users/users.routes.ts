import { Routes } from '@angular/router';
import { UsersComponent } from './users.component';
import { UserDetailComponent } from './user-detail/user-detail.component';
export const UsersRoutes: Routes = [
  { path: '', component: UsersComponent },
   { path: ':id', component: UserDetailComponent },
];