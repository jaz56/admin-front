import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { BookingService } from 'src/app/services/booking.service';
import { Booking } from 'src/app/models/booking.model';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, FormsModule],
  templateUrl: './bookings.component.html',
})
export class BookingsComponent implements OnInit {
  bookings: Booking[] = [];
  loading = false;
  total = 0;
  page = 0;
  limit = 10;
  selectedStatus = '';

  displayedColumns = [
    'uniqueId',
    'appointmentType',
    'appointmentDate',
    'appointmentTime',
    'price',
    'paymentStatus',
    'status',
    'interviewStatus',
    'interviewScore',
    'actions',
  ];

  statuts = [
    { value: '', label: 'Tous' },
    { value: 'confirmed', label: 'Confirmé' },
    { value: 'pending', label: 'En attente' },
    { value: 'cancelled', label: 'Annulé' },
  ];

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.bookingService
      .getAll(this.page, this.limit, this.selectedStatus || undefined)
      .subscribe({
        next: (res) => {
          this.bookings = res.data;
          this.total = res.total;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onStatusChange(): void {
    this.page = 0;
    this.loadBookings();
  }

  onPageChange(event: any): void {
    this.page = event.pageIndex;
    this.limit = event.pageSize;
    this.loadBookings();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  }

  getPaymentClass(status: string): string {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getPaymentLabel(status: string): string {
    switch (status) {
      case 'paid': return 'Payé';
      case 'pending': return 'En attente';
      case 'failed': return 'Échoué';
      default: return status;
    }
  }

  getInterviewClass(status: string): string {
    switch (status) {
      case 'Complété': return 'bg-green-100 text-green-700';
      case 'En attente': return 'bg-yellow-100 text-yellow-700';
      case 'Annulé': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getTypeClass(type: string): string {
    return type === 'premium'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-blue-100 text-blue-700';
  }

  updateStatus(id: string, status: string): void {
    this.bookingService.updateStatus(id, status).subscribe({
      next: () => this.loadBookings(),
    });
  }

  deleteBooking(id: string): void {
    if (confirm('Confirmer la suppression ?')) {
      this.bookingService.delete(id).subscribe({
        next: () => this.loadBookings(),
      });
    }
  }
}