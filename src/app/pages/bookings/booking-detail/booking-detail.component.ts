import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BookingService } from 'src/app/services/booking.service';
import { OrderService } from 'src/app/services/order.service';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';
import { ConfigService } from 'src/app/services/config.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MaterialModule,
    ReactiveFormsModule, PageHeaderComponent,
    MatDatepickerModule, MatNativeDateModule,
  ],
  templateUrl: './booking-detail.component.html',
})
export class BookingDetailComponent implements OnInit {
  booking: any = null;
  orders: any[] = [];
  loading = true;
  creatingOrder = false;
  editMode = false;
  saving = false;

  form!: FormGroup;

  // ── Listes dynamiques ─────────────────────────────────────────────
  typeOptions:              { value: string; label: string }[] = [];
  paymentOptions:           { value: string; label: string }[] = [];
  interviewStatusOptions:   { value: string; label: string }[] = [];
  interviewCompletedOptions:{ value: string; label: string }[] = [];
  destinationOptions:       { value: string; label: string }[] = [];

  // ── Statique (valeurs système) ────────────────────────────────────
  readonly statusOptions = [
    { value: 'confirmed', label: 'Confirmé' },
    { value: 'pending',   label: 'En attente' },
    { value: 'cancelled', label: 'Annulé' },
  ];

  constructor(
    private route:          ActivatedRoute,
    private router:         Router,
    private bookingService: BookingService,
    private orderService:   OrderService,
    private snackBar:       MatSnackBar,
    private configService:  ConfigService,
  ) {}

  ngOnInit(): void {
    // ── Charger toutes les listes dynamiques en parallèle ────────────
    forkJoin({
      types:              this.configService.get('type_booking'),
      payments:           this.configService.get('statut_paiement'),
      interviewStatuts:   this.configService.get('statut_entretien'),
      interviewCompleted: this.configService.get('entretien_complete'),
      destinations:       this.configService.get('destination_demande'),
    }).subscribe({
      next: ({ types, payments, interviewStatuts, interviewCompleted, destinations }) => {
        this.typeOptions              = types.map(t => ({ value: t.value, label: t.label }));
        this.paymentOptions           = payments.map(p => ({ value: p.value, label: p.label }));
        this.interviewStatusOptions   = interviewStatuts.map(s => ({ value: s.value, label: s.label }));
        this.interviewCompletedOptions= interviewCompleted.map(c => ({ value: c.value, label: c.label }));
        this.destinationOptions       = destinations.map(d => ({ value: d.value, label: d.label }));
      },
      error: () => {
        this.typeOptions              = [{ value: 'simple', label: 'Simple' }, { value: 'standard', label: 'Standard' }, { value: 'premium', label: 'Premium' }, { value: 'pro', label: 'Pro' }];
        this.paymentOptions           = [{ value: 'paid', label: 'Payé' }, { value: 'pending', label: 'En attente' }, { value: 'failed', label: 'Échoué' }];
        this.interviewStatusOptions   = [{ value: 'En attente', label: 'En attente' }, { value: 'En cours', label: 'En cours' }, { value: 'Complété', label: 'Complété' }];
        this.interviewCompletedOptions= [{ value: 'yes', label: 'Complété' }, { value: 'no', label: 'Non complété' }];
        this.destinationOptions       = [{ value: 'journees_france', label: '🇫🇷 France' }, { value: 'journees_canada', label: '🇨🇦 Canada' }];
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadBooking(id);
  }

  loadBooking(id: string): void {
    this.loading = true;
    this.bookingService.getById(id).subscribe({
      next: (res: any) => {
        this.booking = res.data;
        this.buildForm();
        this.loading = false;
        this.loadOrders();
      },
      error: () => { this.loading = false; },
    });
  }

  buildForm(): void {
    const b = this.booking;

    // Convertir la date string en objet Date pour le datepicker
    let appointmentDate: Date | null = null;
    if (b.appointmentDate) {
      appointmentDate = new Date(b.appointmentDate);
    }

    this.form = new FormGroup({
      appointmentType:     new FormControl(b.appointmentType),
      appointmentDate:     new FormControl(appointmentDate),
      appointmentTime:     new FormControl(b.appointmentTime),
      price:               new FormControl(b.price),
      journeesDestination: new FormControl(b.journeesDestination),
      status:              new FormControl(b.status),
      paymentStatus:       new FormControl(b.paymentStatus),
      interviewStatus:     new FormControl(b.interviewStatus),
      interviewScore:      new FormControl(this.extractScore(b.interviewScore)),
      interviewCompleted:  new FormControl(b.interviewCompleted || false),
      interviewReport:     new FormControl(b.interviewReport || ''),
      interviewRecording:  new FormControl(b.interviewRecording || ''),
      statusUpdateDate:    new FormControl(b.statusUpdateDate || 'no'),
    });
  }

  extractScore(score: any): number | null {
    if (score == null) return null;
    if (typeof score === 'object' && score.$numberDecimal) return Number(score.$numberDecimal);
    return Number(score);
  }

  getDestinationLabel(value: string): string {
    return this.destinationOptions.find(d => d.value === value)?.label || value || '—';
  }

  getTypeLabel(value: string): string {
    return this.typeOptions.find(t => t.value === value)?.label || value || '—';
  }

  getPaymentLabel(value: string): string {
    return this.paymentOptions.find(p => p.value === value)?.label || value || '—';
  }

  getInterviewStatusLabel(value: string): string {
    return this.interviewStatusOptions.find(s => s.value === value)?.label || value || '—';
  }

  loadOrders(): void {
    if (!this.booking?.uniqueId) return;
    this.orderService.getByBooking(this.booking.uniqueId).subscribe({
      next: (res: any) => { this.orders = res.data || []; },
    });
  }

  get canCreateOrder(): boolean {
    return this.booking?.status === 'confirmed' && this.booking?.paymentStatus === 'paid';
  }

  get orderBlockedReason(): string {
    if (this.canCreateOrder) return '';
    if (this.booking?.status !== 'confirmed')
      return `Le booking doit être "Confirmé" (actuel : ${this.booking?.status})`;
    return `Le paiement doit être "Payé" (actuel : ${this.booking?.paymentStatus})`;
  }

  createOrder(): void {
    if (!this.canCreateOrder) return;
    this.creatingOrder = true;
    const payload = {
      status:   'created',
      currency: 'TND',
      price:    this.booking.price,
      country:  this.booking.journeesDestination?.replace('journees_', '') || '',
    };
    this.orderService.createForBooking(this.booking.id, payload).subscribe({
      next: () => {
        this.creatingOrder = false;
        this.snackBar.open('Commande créée avec succès !', 'Fermer', { duration: 3000 });
        this.loadOrders();
      },
      error: (err: any) => {
        this.creatingOrder = false;
        this.snackBar.open(err.error?.message || 'Erreur lors de la création', 'Fermer', { duration: 4000 });
      },
    });
  }

  toggleEdit(): void {
    if (this.editMode) this.buildForm();
    this.editMode = !this.editMode;
  }

  saveChanges(): void {
    this.saving = true;
    const v = this.form.value;

    // Convertir Date → ISO string pour le backend
    const appointmentDate = v.appointmentDate instanceof Date
      ? v.appointmentDate.toISOString()
      : v.appointmentDate;

    const payload = {
      appointmentType:     v.appointmentType,
      appointmentDate:     appointmentDate,
      appointmentTime:     v.appointmentTime,
      price:               v.price,
      journeesDestination: v.journeesDestination,
      status:              v.status,
      paymentStatus:       v.paymentStatus,
      interviewStatus:     v.interviewStatus,
      interviewScore:      v.interviewScore,
      interviewCompleted:  v.interviewCompleted,
      interviewReport:     v.interviewReport,
      interviewRecording:  v.interviewRecording,
      statusUpdateDate:    v.statusUpdateDate,
    };

    this.bookingService.update(this.booking.id, payload).subscribe({
      next: () => {
        this.saving   = false;
        this.editMode = false;
        this.snackBar.open('Booking mis à jour avec succès !', 'Fermer', { duration: 3000 });
        this.loadBooking(this.booking.id);
      },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Erreur lors de la mise à jour', 'Fermer', { duration: 4000 });
      },
    });
  }

  goBack(): void { this.router.navigate(['/bookings']); }
}