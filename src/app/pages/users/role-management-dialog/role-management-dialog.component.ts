import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { RoleService } from 'src/app/services/role.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-role-management-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  template: `
    <div class="p-6">
      <!-- En-tête de la Pop-up -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800 m-0 flex items-center gap-2">
          <mat-icon class="text-blue-600">badge</mat-icon> Configuration des Rôles
        </h2>
        <button mat-icon-button (click)="close()"><mat-icon>close</mat-icon></button>
      </div>
      
      <p class="text-gray-500 text-xs mb-4">Ajoutez ou supprimez les rôles disponibles pour les profils utilisateurs de la plateforme.</p>

      <!-- Liste des Rôles Existants -->
      <div class="border border-gray-100 bg-gray-50/50 rounded-xl max-h-60 overflow-y-auto mb-6">
        <div *ngIf="loading" class="p-4 flex justify-center">
          <mat-spinner diameter="30"></mat-spinner>
        </div>
        
        <div *ngIf="!loading && roles.length === 0" class="p-4 text-center text-gray-400 text-sm">
          Aucun rôle personnalisé configuré.
        </div>

        <div *ngFor="let r of roles" class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-gray-800">{{ r.label }}</span>
            <span class="text-xs font-mono text-gray-400">ID: {{ r.value }}</span>
          </div>
          <!-- Protection pour ne pas supprimer les rôles vitaux du système si nécessaire -->
          <button mat-icon-button color="warn" 
  (click)="deleteRole(r)" 
  [disabled]="isSystemRole(r)"
  matTooltip="{{ isSystemRole(r) ? 'Rôle système, non supprimable' : 'Supprimer le rôle' }}">
  <mat-icon class="text-lg!">delete_outline</mat-icon>
</button>
        </div>
      </div>

      <hr class="border-gray-100 my-4" />

      <!-- Formulaire d'Ajout Rapide -->
      <div class="bg-blue-50/40 border border-blue-100 rounded-xl p-4">
        <h3 class="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">Créer un nouveau rôle</h3>
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-2 gap-2">
            <input type="text" [(ngModel)]="newRoleLabel" placeholder="Nom (Ex: Recruteur)" 
                   class="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" [(ngModel)]="newRoleValue" placeholder="Code (Ex: recruteur)" 
                   class="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
          <button mat-flat-button color="primary" (click)="addRole()" [disabled]="!newRoleLabel || !newRoleValue" class="w-full rounded-lg py-1">
            <mat-icon>add</mat-icon> Confirmer la création
          </button>
        </div>
      </div>
    </div>
  `
})
export class RoleManagementDialogComponent implements OnInit {
  roles: any[] = [];
  loading = false;
  
  newRoleLabel = '';
  newRoleValue = '';

  constructor(
    private roleService: RoleService,
    private dialogRef: MatDialogRef<RoleManagementDialogComponent>
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.roleService.getAll().subscribe({
      next: (res) => { this.roles = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  addRole(): void {
    if (!this.newRoleLabel || !this.newRoleValue) return;
    
    const payload = { 
      value: this.newRoleValue.trim().toLowerCase(), 
      label: this.newRoleLabel.trim() 
    };

    this.roleService.create(payload).subscribe({
      next: () => {
        this.newRoleLabel = '';
        this.newRoleValue = '';
        this.refresh();
      }
    });
  }

 deleteRole(role: any): void {
  console.log('Role à supprimer:', role); // ← vérifier la structure
  const id = role.id || role._id;
  console.log('ID utilisé:', id);
  
  if (!id) {
    console.error('ID manquant, impossible de supprimer');
    return;
  }
  
  if (confirm(`Voulez-vous vraiment supprimer le rôle "${role.label}" ?`)) {
    this.roleService.delete(id).subscribe({
      next: () => this.refresh(),
      error: (err) => console.error('Erreur suppression:', err)
    });
  }
}

  isSystemRole(role: any): boolean {
    // Liste de sécurité pour empêcher la suppression accidentelle des rôles de base
   return role.system === true;
  }

  close(): void {
    this.dialogRef.close();
  }
}