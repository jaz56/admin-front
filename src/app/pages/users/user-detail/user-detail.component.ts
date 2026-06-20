import { Component, OnInit, OnDestroy, ViewChild,ElementRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { UserService } from 'src/app/services/user.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { GdriveImagePipe } from 'src/app/pipe/gdrive-image.pipe';
import { Router } from '@angular/router';
import { RoleService } from 'src/app/services/role.service';
import { ConfigService, ConfigItem } from 'src/app/services/config.service';
import { CountryService } from 'src/app/services/country.service';
import { forkJoin } from 'rxjs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    ReactiveFormsModule,
    GdriveImagePipe,
     FormsModule, 
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent implements OnInit, OnDestroy {
  user: any = null;
  loading = true;
  editMode = false;
  saving = false;
  editForm!: FormGroup;

  fonctionOptions: ConfigItem[] = [];
  statutOptions:   ConfigItem[] = [];
  progressSteps:   ConfigItem[] = [];
  paysOptions:     { value: string; label: string }[] = [];
  dynamicRoles:    { value: string; label: string }[] = [];

  startDate = new Date(1990, 0, 1);
  configLoaded = false;

  interessesParControl = new FormControl('');
  nationaliteControl   = new FormControl('');
  favoriteJobsControl  = new FormControl('');

  // ── Recherche pays ──────────────────────────────────────────────────
  paysSearchText       = '';
  filteredPaysOptions: { value: string; label: string }[] = [];

  uploading: { [key: string]: boolean } = {
    photo: false, cinRecto: false, cinVerso: false, vocal: false,
  };

  // ── Enregistrement vocal ────────────────────────────────────────────
  mediaRecorder: any;
  audioChunks:   any[] = [];
  isRecording    = false;
  recordingDuration = 0;
  recordingTimer: any;

  constructor(
    private route:          ActivatedRoute,
    private userService:    UserService,
    private router:         Router,
    private fb:             FormBuilder,
    private roleService:    RoleService,
    private configService:  ConfigService,
    private countryService: CountryService,
  ) {}

  // ── Lifecycle ───────────────────────────────────────────────────────
  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');

    forkJoin({
      fonctions: this.configService.getFonctions(),
      statuts:   this.configService.getStatuts(),
      steps:     this.configService.getSteps(),
      pays:      this.countryService.getActiveForSelect(),
      roles:     this.roleService.getAll(),
    }).subscribe({
      next: ({ fonctions, statuts, steps, pays, roles }) => {
        this.fonctionOptions     = fonctions;
        this.statutOptions       = statuts;
        this.progressSteps       = steps;
        this.paysOptions         = pays;
        this.filteredPaysOptions = pays;  // ← initialiser la liste filtrée
        this.dynamicRoles        = roles.map((r: any) => ({ value: r.value, label: r.label }));
        this.configLoaded        = true;
        if (userId) this.loadUser(userId);
      },
      error: () => {
        this.configLoaded = true;
        if (userId) this.loadUser(userId);
      }
    });
  }
@ViewChild('paysSearchInput') paysSearchInput!: ElementRef;
onPaysSelectOpened(): void {
  // Focus automatique sur l'input de recherche à l'ouverture
  setTimeout(() => {
    this.paysSearchInput?.nativeElement?.focus();
  }, 100);
}

  ngOnDestroy(): void {
    if (this.recordingTimer) clearInterval(this.recordingTimer);
  }

  // ── Recherche pays ──────────────────────────────────────────────────
  onPaysSearch(): void {
    const term = this.paysSearchText.toLowerCase().trim();
    this.filteredPaysOptions = term
      ? this.paysOptions.filter(p =>
          p.label.toLowerCase().includes(term) ||
          p.value.toLowerCase().includes(term)
        )
      : this.paysOptions;
  }

  clearPaysSearch(): void {
    this.paysSearchText      = '';
    this.filteredPaysOptions = this.paysOptions;
  }

  onPaysSelectClosed(): void {
  this.clearPaysSearch();
}
getSelectedPaysLabel(): string {
  const val = this.editForm?.get('paysValue')?.value;
  if (!val) return '';
  return this.paysOptions.find(p => p.value === val)?.label || val;
}
  // ── Chargement utilisateur ──────────────────────────────────────────
  loadUser(id: string): void {
    this.loading = true;
    this.userService.getById(id).subscribe({
      next: (res) => {
        this.user = res.data;
        this.initForm();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  initForm(): void {
    this.favoriteJobsControl.setValue(
      Array.isArray(this.user.favoriteJobs) ? this.user.favoriteJobs.join(', ') : ''
    );

    this.editForm = this.fb.group({
      nom:                         [this.user.nom || ''],
      prenom:                      [this.user.prenom || ''],
      email:                       [this.user.email || ''],
      numeroTel:                   [this.user.numeroTel || ''],
      sexe:                        [this.user.sexe || ''],
      dateDeNaissance:             [
        this.user.dateDeNaissance ? new Date(this.user.dateDeNaissance) : null
      ],
      paysValue:                   [this.user.pays?.value || ''],
      paysLabel:                   [this.user.pays?.label || ''],
      address:                     [this.user.address || ''],
      codePostal:                  [this.user.codePostal || ''],
      dernierePosteOccupe:         [this.user.dernierePosteOccupe || ''],
      fonction:                    [this.user.fonction || ''],
      langueDeProcedure:           [this.user.langueDeProcedure || 'french'],
      pieceIdentite:               [this.user.pieceIdentite || ''],
      candidateVerificationStatus: [this.user.candidateVerificationStatus || 'pending'],
      role:                        [this.user.role || 'candidat'],
      verifiedEmail:               [this.user.verifiedEmail ?? false],
      balance:                     [this.user.balance ?? 0],
      cashback:                    [this.user.cashback ?? 0],
      progress:                    [this.user.progress || ''],
    });

    this.interessesParControl.setValue(
      Array.isArray(this.user.interessesPar)
        ? this.user.interessesPar.join(', ')
        : (this.user.interessesPar || '')
    );
    this.nationaliteControl.setValue(
      Array.isArray(this.user.nationalite)
        ? this.user.nationalite.join(', ')
        : (this.user.nationalite || '')
    );
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) this.initForm();
  }

  onPaysChange(value: string): void {
    const found = this.paysOptions.find(p => p.value === value);
    if (found) this.editForm.patchValue({ paysLabel: found.label });
  }

  private parseArrayField(value: string): string[] {
    if (!value?.trim()) return [];
    return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  // ── Sauvegarde ──────────────────────────────────────────────────────
  saveChanges(): void {
    this.saving = true;
    const f = this.editForm.value;

    const payload = {
      ...this.user,
      nom:                         f.nom,
      prenom:                      f.prenom,
      email:                       f.email,
      numeroTel:                   f.numeroTel,
      sexe:                        f.sexe,
      dateDeNaissance:             f.dateDeNaissance
        ? (f.dateDeNaissance instanceof Date
            ? f.dateDeNaissance.toISOString().split('T')[0] + 'T00:00:00'
            : f.dateDeNaissance + 'T00:00:00')
        : null,
      pays:                        { value: f.paysValue, label: f.paysLabel },
      address:                     f.address,
      codePostal:                  f.codePostal,
      dernierePosteOccupe:         f.dernierePosteOccupe,
      fonction:                    f.fonction,
      langueDeProcedure:           f.langueDeProcedure,
      pieceIdentite:               f.pieceIdentite,
      candidateVerificationStatus: f.candidateVerificationStatus,
      role:                        f.role,
      verifiedEmail:               f.verifiedEmail,
      balance:                     f.balance,
      cashback:                    f.cashback,
      interessesPar:               this.parseArrayField(this.interessesParControl.value || ''),
      nationalite:                 this.parseArrayField(this.nationaliteControl.value || ''),
      favoriteJobs:                this.parseArrayField(this.favoriteJobsControl.value || ''),
      progress:                    f.progress || null,
    };

    this.userService.update(this.user.id, payload).subscribe({
      next: (res) => {
        this.user    = res.data;
        this.editMode = false;
        this.saving  = false;
        this.initForm();
      },
      error: (err) => {
        console.error('Erreur mise à jour', err);
        this.saving = false;
      }
    });
  }

  // ── Upload fichiers ─────────────────────────────────────────────────
  onFileSelected(event: Event, type: string): void {
    const target = event.target as HTMLInputElement;
    if (!target.files?.length) return;

    this.uploading[type] = true;
    this.saving = true;

    this.userService.uploadFile(this.user.id, type, target.files[0]).subscribe({
      next: (res: any) => {
        if (res?.data?.url) this.user[type] = res.data.url;
        this.uploading[type] = false;
        this.saving          = false;
        this.isRecording     = false;
      },
      error: (err) => {
        console.error('Erreur upload', err);
        this.uploading[type] = false;
        this.saving          = false;
        this.isRecording     = false;
      }
    });
  }

  // ── Vocal ───────────────────────────────────────────────────────────
  toggleRecording(): void {
    this.isRecording ? this.stopRecording() : this.startRecording();
  }

  startRecording(): void {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.audioChunks  = [];
        this.mediaRecorder = new MediaRecorder(stream);

        this.mediaRecorder.ondataavailable = (e: any) => this.audioChunks.push(e.data);

        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.audioChunks, { type: 'audio/wav' });
          const file = new File([blob], `vocal_${this.user.id}_${Date.now()}.wav`, { type: 'audio/wav' });
          this.onFileSelected({ target: { files: [file] } } as any, 'vocal');
          stream.getTracks().forEach(t => t.stop());
        };

        this.mediaRecorder.start();
        this.isRecording      = true;
        this.recordingDuration = 0;
        this.recordingTimer   = setInterval(() => this.recordingDuration++, 1000);
      })
      .catch(() => alert("Accès au microphone refusé ou non disponible."));
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      clearInterval(this.recordingTimer);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  createDemande(): void {
    this.router.navigate(['/demandes/new'], { queryParams: { userId: this.user.id } });
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/profile/user-1.jpg';
  }

  getFonctionLabel(value: string): string {
    return this.fonctionOptions.find(f => f.value === value)?.label || value || '—';
  }

  getLangueLabel(value: string): string {
    const map: any = { french: 'Français', arabic: 'Arabe', english: 'Anglais' };
    return map[value] || value || 'Français';
  }

  getStatutColor(value: string): string {
    const found = this.statutOptions.find(s => s.value === value);
    return this.configService.getStatutClass(found?.color);
  }

  getStatutLabel(value: string): string {
    return this.statutOptions.find(s => s.value === value)?.label || value || '—';
  }

  getProgressInfo(progress: string): { label: string; icon: string; index: number } {
    const idx = this.progressSteps.findIndex(s => s.value === progress);
    if (idx === -1) return { label: progress || 'Inconnu', icon: 'help_outline', index: -1 };
    return {
      label: this.progressSteps[idx].label,
      icon:  this.progressSteps[idx].icon || 'flag',
      index: idx,
    };
  }

  get progressPercentage(): number {
    if (!this.user?.progress) return 0;
    const idx = this.progressSteps.findIndex(s => s.value === this.user.progress);
    return idx === -1 ? 0 : Math.round(((idx + 1) / this.progressSteps.length) * 100);
  }

 getAudioMimeType(url: string): string {
  const ext = url?.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    webm: 'audio/webm'
  };
  return map[ext] ?? 'audio/mpeg';
}
}