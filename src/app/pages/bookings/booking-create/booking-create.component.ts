import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BookingService } from 'src/app/services/booking.service';
import { DemandeService } from 'src/app/services/demande.service';
import { ConfigService } from 'src/app/services/config.service';
import { PageHeaderComponent } from 'src/app/components/page-header/page-header.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-booking-create',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MaterialModule,
    FormsModule, ReactiveFormsModule,
    MatDatepickerModule, MatNativeDateModule,
    PageHeaderComponent,
  ],
  templateUrl: './booking-create.component.html',
})
export class BookingCreateComponent implements OnInit {
  saving = false;
  loadingDemande = true;
  demande: any = null;
  demandeId: string | null = null;

  // ── Listes dynamiques ─────────────────────────────────────────────
  typeOptions:         { value: string; label: string; price?: number }[] = [];
  destinations:        { value: string; label: string }[] = [];

  // Prix par défaut par type (sera remplacé si config contient un prix)
  private readonly defaultPrices: Record<string, number> = {
    simple:   30,
    standard: 50,
    premium:  100,
    pro:      150,
  };

  form = new FormGroup({
    appointmentType:     new FormControl('', Validators.required),
    appointmentDate:     new FormControl<Date | null>(null, Validators.required),
    appointmentTime:     new FormControl('', Validators.required),
    price:               new FormControl<number | null>(null, Validators.required),
    journeesDestination: new FormControl('', Validators.required),
  });

  constructor(
    private route:          ActivatedRoute,
    private router:         Router,
    private bookingService: BookingService,
    private demandeService: DemandeService,
    private configService:  ConfigService,
    private snackBar:       MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.demandeId = this.route.snapshot.queryParamMap.get('demandeId');

    if (!this.demandeId) {
      this.snackBar.open('Aucune demande sélectionnée', 'Fermer', { duration: 3000 });
      this.router.navigate(['/demandes']);
      return;
    }

    // ── Charger listes dynamiques + demande en parallèle ─────────────
    forkJoin({
      types:        this.configService.get('type_booking'),
      destinations: this.configService.get('destination_demande'),
    }).subscribe({
      next: ({ types, destinations }) => {
        this.typeOptions = types.map(t => ({
          value: t.value,
          label: t.label,
          price: this.defaultPrices[t.value] ?? 50,
        }));
        this.destinations = destinations.map(d => ({ value: d.value, label: d.label }));

        // Valeur par défaut type
        if (this.typeOptions.length) {
          const first = this.typeOptions[0];
          this.form.patchValue({ appointmentType: first.value, price: first.price ?? 50 });
        }

        this.loadDemande();
      },
      error: () => {
        // Fallback statique
        this.typeOptions  = [
          { value: 'simple',   label: 'Simple',   price: 30  },
          { value: 'standard', label: 'Standard', price: 50  },
          { value: 'premium',  label: 'Premium',  price: 100 },
          { value: 'pro',      label: 'Pro',      price: 150 },
        ];
        this.destinations = [
          { value: 'journees_france',    label: '🇫🇷 France'    },
          { value: 'journees_canada',    label: '🇨🇦 Canada'    },
          { value: 'journees_allemagne', label: '🇩🇪 Allemagne' },
          { value: 'journees_belgique',  label: '🇧🇪 Belgique'  },
        ];
        this.form.patchValue({ appointmentType: 'standard', price: 50 });
        this.loadDemande();
      }
    });
  }

  loadDemande(): void {
    this.loadingDemande = true;
    this.demandeService.getById(this.demandeId!).subscribe({
      next: (res: any) => {
        this.demande = res.data;
        // Pré-remplir la destination depuis la demande si disponible
        if (this.demande?.journeesDestination) {
          this.form.patchValue({ journeesDestination: this.demande.journeesDestination });
        }
        this.loadingDemande = false;
      },
      error: () => {
        this.loadingDemande = false;
        this.snackBar.open('Demande introuvable', 'Fermer', { duration: 3000 });
        this.router.navigate(['/demandes']);
      },
    });
  }

  onTypeChange(): void {
    const type   = this.form.get('appointmentType')?.value;
    const option = this.typeOptions.find(t => t.value === type);
    if (option?.price != null) {
      this.form.patchValue({ price: option.price });
    }
  }

  getUserLabel(): string {
    if (!this.demande) return '';
    return `${this.demande.candidatPrenom || ''} ${this.demande.candidatNom || ''}`.trim()
      || this.demande.user || 'Candidat';
  }

  submit(): void {
    if (this.form.invalid) {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
      return;
    }

    this.saving = true;
    const v = this.form.value;

    // Convertir Date → ISO string pour le backend
    const appointmentDate = v.appointmentDate instanceof Date
      ? v.appointmentDate.toISOString()
      : v.appointmentDate;

    const payload = {
      user:                this.demande.userId,
      demande:             this.demande.id,
      appointmentType:     v.appointmentType,
      appointmentDate:     appointmentDate,
      appointmentTime:     v.appointmentTime,
      price:               v.price,
      journeesDestination: v.journeesDestination,
    };

    this.bookingService.createAsAdmin(payload).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Booking créé avec succès !', 'Fermer', { duration: 3000 });
        this.router.navigate(['/bookings']);
      },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(
          err.error?.message || 'Erreur lors de la création',
          'Fermer', { duration: 4000 }
        );
      },
    });
  }

  cancel(): void {
    this.demandeId
      ? this.router.navigate(['/demandes', this.demandeId])
      : this.router.navigate(['/bookings']);
  }
}