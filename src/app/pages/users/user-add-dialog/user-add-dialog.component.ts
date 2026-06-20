import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { UserService } from 'src/app/services/user.service';
import { RoleService } from 'src/app/services/role.service';
import { CountryService } from 'src/app/services/country.service';

@Component({
  selector: 'app-user-add-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule, MatAutocompleteModule],
  templateUrl: './user-add-dialog.component.html',
})
export class UserAddDialogComponent implements OnInit {
  userForm: FormGroup;
  loading = false;
  currentStep = 0;
  roles: { value: string; label: string }[] = [];

  // ── Pays ─────────────────────────────────────────────────────────────
  allPays:           { value: string; label: string }[] = [];
  filteredPays:      { value: string; label: string }[] = [];
  paysSearchText =   '';
  selectedPaysValue = '';

  // Fichiers
  photoFile:    File | null = null;
  cinRectoFile: File | null = null;
  cinVersoFile: File | null = null;
  vocalFile:    File | null = null;
  fileNames: { [key: string]: string | null } = {
    photo: null, cinRecto: null, cinVerso: null, vocal: null,
  };

  constructor(
    private fb:          FormBuilder,
    private dialogRef:   MatDialogRef<UserAddDialogComponent>,
    private userService: UserService,
    private roleService: RoleService,
    private countryService: CountryService,
  ) {
    this.userForm = this.fb.group({
      prenom:              ['', Validators.required],
      nom:                 ['', Validators.required],
      email:               ['', [Validators.required, Validators.email]],
      password:            ['', [Validators.required, Validators.minLength(6)]],
      role:                ['candidat', Validators.required],
      sexe:                [''],
      dateDeNaissance:     [''],
      numeroTel:           [''],
      paysValue:           [''],
      paysLabel:           [''],
      address:             [''],
      codePostal:          [''],
      nationalite:         [''],
      dernierePosteOccupe: [''],
      fonction:            [''],
      langueDeProcedure:   ['french'],
      pieceIdentite:       [''],
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.countryService.getActiveForSelect().subscribe(pays => {
      this.allPays      = pays;
      this.filteredPays = pays;
    });
  }

  // ── Rôles ─────────────────────────────────────────────────────────────
  loadRoles(): void {
    this.roleService.getAll().subscribe({
      next: (res) => {
        this.roles = res.map((r: any) => ({ value: r.value, label: r.label }));
      },
      error: () => {
        this.roles = [
          { value: 'candidat', label: 'Candidat' },
          { value: 'admin',    label: 'Admin' },
          { value: 'company',  label: 'Entreprise' },
        ];
      }
    });
  }

  // ── Autocomplete pays ──────────────────────────────────────────────────
  onPaysSearch(): void {
    const term = this.paysSearchText.toLowerCase().trim();
    this.filteredPays = term
      ? this.allPays.filter(p =>
          p.label.toLowerCase().includes(term) ||
          p.value.toLowerCase().includes(term)
        ).slice(0, 10)
      : this.allPays;
  }

  onPaysSelected(event: MatAutocompleteSelectedEvent): void {
    const label = event.option.value as string;
    const found = this.allPays.find(p => p.label === label);
    if (found) {
      this.paysSearchText  = found.label;
      this.selectedPaysValue = found.value;
      this.userForm.patchValue({ paysValue: found.value, paysLabel: found.label });
    }
  }

  clearPays(): void {
    this.paysSearchText    = '';
    this.selectedPaysValue = '';
    this.filteredPays      = this.allPays;
    this.userForm.patchValue({ paysValue: '', paysLabel: '' });
  }

  highlightMatch(label: string, term: string): string {
    if (!term) return label;
    const regex = new RegExp(
      `(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'
    );
    return label.replace(regex, '<strong style="color:#2563eb;">$1</strong>');
  }

  // ── Fichiers ──────────────────────────────────────────────────────────
  onFileSelected(event: Event, type: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    switch (type) {
      case 'photo':    this.photoFile    = file; break;
      case 'cinRecto': this.cinRectoFile = file; break;
      case 'cinVerso': this.cinVersoFile = file; break;
      case 'vocal':    this.vocalFile    = file; break;
    }
    this.fileNames[type] = file.name;
  }

  removeFile(type: string): void {
    switch (type) {
      case 'photo':    this.photoFile    = null; break;
      case 'cinRecto': this.cinRectoFile = null; break;
      case 'cinVerso': this.cinVersoFile = null; break;
      case 'vocal':    this.vocalFile    = null; break;
    }
    this.fileNames[type] = null;
  }

  // ── Mot de passe ──────────────────────────────────────────────────────
  generatePassword(): void {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    this.userForm.patchValue({ password: pwd });
  }

  copyPassword(): void {
    const pwd = this.userForm.get('password')?.value;
    if (pwd) navigator.clipboard.writeText(pwd).catch(console.error);
  }

  // ── Soumission ────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.userForm.invalid) return;
    this.loading = true;
    const f = this.userForm.value;

    const payload = {
      email:               f.email,
      nom:                 f.nom,
      prenom:              f.prenom,
      password:            f.password,
      role:                f.role,
      sexe:                f.sexe,
      dateDeNaissance:     f.dateDeNaissance || null,
      numeroTel:           f.numeroTel,
      pays:                { value: f.paysValue, label: f.paysLabel },
      address:             f.address,
      codePostal:          f.codePostal,
      nationalite:         f.nationalite ? [f.nationalite] : [],
      dernierePosteOccupe: f.dernierePosteOccupe,
      fonction:            f.fonction,
      langueDeProcedure:   f.langueDeProcedure,
      pieceIdentite:       f.pieceIdentite,
    };

    this.userService.createUser(payload).subscribe({
      next: (res) => {
        const userId = res.data?.id;
        if (userId) this.uploadDocuments(userId);
        else { this.loading = false; this.dialogRef.close('created'); }
      },
      error: () => { this.loading = false; }
    });
  }

  private uploadDocuments(userId: string): void {
    const uploads: { type: string; file: File }[] = [];
    if (this.photoFile)    uploads.push({ type: 'photo',    file: this.photoFile });
    if (this.cinRectoFile) uploads.push({ type: 'cinRecto', file: this.cinRectoFile });
    if (this.cinVersoFile) uploads.push({ type: 'cinVerso', file: this.cinVersoFile });
    if (this.vocalFile)    uploads.push({ type: 'vocal',    file: this.vocalFile });

    if (!uploads.length) { this.loading = false; this.dialogRef.close('created'); return; }

    let done = 0;
    const check = () => { if (++done === uploads.length) { this.loading = false; this.dialogRef.close('created'); } };
    uploads.forEach(u => {
      this.userService.uploadFile(userId, u.type, u.file).subscribe({ next: check, error: () => check() });
    });
  }
}