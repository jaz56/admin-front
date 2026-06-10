import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CandidateService } from 'src/app/services/candidate.service';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-candidate-booking',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule,MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './candidate-booking.component.html',
})
export class CandidateBookingComponent implements OnInit {
  loading = true;
  booking: any = null;
  demande: any = null;
  step = 1; // 1: choix type, 2: choix créneau, 3: paiement, 4: confirmation

  // Sélections
  selectedType: 'standard' | 'premium' = 'standard';
  selectedDate: string = '';
  selectedTime: string = '';

  prices = { standard: 50, premium: 100 };

 appointmentTypes: { id: 'standard' | 'premium'; label: string; price: number; duration: string; color: string; selectedColor: string; iconColor: string; features: string[] }[] = [
    {
       id: 'standard' as const,
      label: 'Entretien Standard',
      price: 50,
      duration: '30 min',
      color: 'border-blue-200 bg-blue-50',
      selectedColor: 'border-blue-500 bg-blue-50 ring-2 ring-blue-200',
      iconColor: 'text-blue-500',
      features: [
        'Entretien vidéo 30 minutes',
        'Évaluation du profil',
        'Rapport de résultats',
      ],
    },
    {
      id: 'premium' as const,
      label: 'Entretien Premium',
      price: 100,
      duration: '60 min',
      color: 'border-purple-200 bg-purple-50',
      selectedColor: 'border-purple-500 bg-purple-50 ring-2 ring-purple-200',
      iconColor: 'text-purple-500',
      features: [
        'Entretien vidéo 60 minutes',
        'Évaluation approfondie',
        'Rapport détaillé + conseils',
        'Suivi personnalisé',
      ],
    },
  ];

  availableTimes = [
    '08:00', '09:00', '10:00', '11:00',
    '14:00', '15:00', '16:00', '17:00',
  ];

  // Simulation paiement
  paymentStep = 1; // 1: formulaire, 2: processing, 3: success
  cardNumber = '';
  cardName = '';
  cardExpiry = '';
  cardCvv = '';

  constructor(
    private candidateService: CandidateService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.candidateService.getMyBooking().subscribe({
      next: (res) => {
        this.booking = res?.data || null;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });

    this.candidateService.getMyDemande().subscribe({
      next: (res) => { this.demande = res?.data || null; },
      error: () => {},
    });
  }

  canBook(): boolean {
    return this.demande?.status === 'pre_selection' ||
           this.demande?.status === 'selection';
  }

  selectType(type: 'standard' | 'premium'): void {
    this.selectedType = type;
  }

  getMinDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  getMaxDate(): string {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);
    return maxDate.toISOString().split('T')[0];
  }

  isWeekend(dateStr: string): boolean {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  onDateChange(): void {
    this.selectedTime = '';
  }

  goToStep(step: number): void {
    this.step = step;
  }

  processPayment(): void {
    this.paymentStep = 2;
    setTimeout(() => {
      this.submitBooking();
    }, 2000);
  }

  submitBooking(): void {
    const payload = {
      appointmentType: this.selectedType,
      appointmentDate: this.selectedDate,
      appointmentTime: this.selectedTime,
      price: this.prices[this.selectedType],
      journeesDestination: this.demande?.journeesDestination || '',
    };

    this.http.post(`${environment.apiUrl}/bookings`, payload).subscribe({
      next: (res: any) => {
        this.paymentStep = 3;
        setTimeout(() => {
          this.step = 4;
          this.booking = res?.data || payload;
        }, 1500);
      },
      error: () => {
        this.paymentStep = 1;
        this.snackBar.open('Erreur lors de la réservation', 'Fermer', { duration: 3000 });
      },
    });
  }

  formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    value = value.match(/.{1,4}/g)?.join(' ') || value;
    this.cardNumber = value.substring(0, 19);
  }

  formatExpiry(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    this.cardExpiry = value;
  }

  getTypeInfo(type: string) {
    return this.appointmentTypes.find(t => t.id === type);
  }

  isPaymentFormValid(): boolean {
    return this.cardNumber.length >= 19 &&
           this.cardName.length > 2 &&
           this.cardExpiry.length === 5 &&
           this.cardCvv.length === 3;
  }
}