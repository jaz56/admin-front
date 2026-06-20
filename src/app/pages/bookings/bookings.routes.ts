import { Routes } from '@angular/router';
import { BookingsComponent } from './bookings.component';
import { BookingCreateComponent } from './booking-create/booking-create.component';
import { BookingDetailComponent } from './booking-detail/booking-detail.component';
export const BookingsRoutes: Routes = [
  { path: '', component: BookingsComponent },
    { path: 'new', component: BookingCreateComponent },
{ path: ':id', component: BookingDetailComponent },
];