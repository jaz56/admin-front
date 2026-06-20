import { Component, OnInit, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfigService, ConfigItem } from 'src/app/services/config.service';
import { RoleService } from 'src/app/services/role.service';
import { forkJoin } from 'rxjs';

interface Tab {
  key: string;
  label: string;
  icon: string;
  system?: string[];
  isRoles?: boolean;
}

@Component({
  selector: 'app-platform-config-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  styles: [`
    :host { display: block; }

    .dialog-wrapper {
    width: 100%;          /* ← prend la largeur du dialog */
    display: flex;
    flex-direction: column;
    max-height: 88vh;
  }

   
  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
  }
    /* La liste défile */
  .list-scroll {
    max-height: 260px;
    max-width: 520px;     /* ← contraindre la liste à sa taille d'origine */
    overflow-y: auto;
    overflow-x: hidden;
    border: 1px solid #f3f4f6;
    border-radius: 12px;
  }


    .list-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 14px;
      border-bottom: 1px solid #f9fafb;
      transition: background 0.12s;
    }
    .list-item:last-child { border-bottom: none; }
    .list-item:hover { background: #f9fafb; }
    .list-item:hover .action-btns { opacity: 1; }

    .action-btns {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.12s;
      flex-shrink: 0;
    }

    /* Formulaire fixe */
    .add-box {
      background: rgba(239,246,255,0.6);
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 14px;
      flex-shrink: 0;
    }

    .add-title {
      font-size: 11px;
      font-weight: 700;
      color: #1e40af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
    }

    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
    .field {
      width: 100%;
      padding: 7px 11px;
      font-size: 13px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      outline: none;
      box-sizing: border-box;
    }
    .field:focus { border-color: #60a5fa; box-shadow: 0 0 0 2px rgba(96,165,250,0.2); }
    .field.mono { font-family: monospace; }

    .color-row { display: flex; gap: 6px; flex-wrap: wrap; margin: 4px 0 8px; }
    .color-chip {
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 500;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.12s;
      opacity: 0.6;
    }
    .color-chip:hover { opacity: 1; }
    .color-chip.selected { border-color: #374151; opacity: 1; transform: scale(1.05); }

    .preview-box {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 11px; background: white;
      border: 1px solid #f3f4f6; border-radius: 8px; margin-bottom: 8px;
    }

    .badge { padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .initiale {
      width: 30px; height: 30px; border-radius: 8px;
      background: #dbeafe; color: #1d4ed8;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; flex-shrink: 0;
    }
    .system-badge {
      font-size: 10px; background: #f3f4f6; color: #6b7280;
      padding: 2px 7px; border-radius: 9999px; white-space: nowrap; flex-shrink: 0;
    }
    .empty { padding: 20px; text-align: center; color: #9ca3af; font-size: 13px; }

    /* Inline edit */
    .edit-row {
      display: flex; gap: 6px; align-items: center;
      padding: 6px 14px; border-bottom: 1px solid #e5e7eb;
      background: #eff6ff;
    }
    .edit-field {
      flex: 1; padding: 5px 9px; font-size: 12px;
      border: 1px solid #93c5fd; border-radius: 6px; outline: none;
    }
    .edit-field.mono { font-family: monospace; }
  `],
  template: `
    <div class="dialog-wrapper">

      <!-- Header fixe -->
      <div class="dialog-header">
        <h2 style="margin:0; font-size:16px; font-weight:700; color:#1f2937;
                   display:flex; align-items:center; gap:8px;">
          <mat-icon style="color:#2563eb;">tune</mat-icon>
  {{ dialogTitle }}
        </h2>
        <button mat-icon-button (click)="close()"><mat-icon>close</mat-icon></button>
      </div>

      <!-- Onglets -->
      <mat-tab-group [(selectedIndex)]="activeTab" animationDuration="150ms"
                     style="flex:1; overflow:hidden;">

        <mat-tab *ngFor="let tab of tabs">
          <ng-template mat-tab-label>
            <mat-icon style="font-size:14px;width:14px;height:14px;margin-right:4px;">
              {{ tab.icon }}
            </mat-icon>
            {{ tab.label }}
            <span style="margin-left:4px; background:#f3f4f6; color:#4b5563;
                         font-size:10px; font-weight:700; border-radius:9999px;
                         padding:1px 5px;">
              {{ tab.isRoles ? roles.length : getItems(tab.key).length }}
            </span>
          </ng-template>

          <!-- Contenu de l'onglet : flex-column, liste scrolle, ajout fixe -->
<div style="display:flex; flex-direction:column; gap:12px; padding:14px 24px;">
  <div style="max-width:520px; display:flex; flex-direction:column; gap:12px;">

            <div *ngIf="loading" style="display:flex; justify-content:center; padding:24px;">
              <mat-spinner diameter="28"></mat-spinner>
            </div>

            <ng-container *ngIf="!loading">

              <!-- ══════════ RÔLES ══════════ -->
              <ng-container *ngIf="tab.isRoles">

                <!-- Liste scrollable -->
                <div class="list-scroll">
                  <div *ngIf="roles.length === 0" class="empty">Aucun rôle.</div>

                  <ng-container *ngFor="let r of roles">
                    <!-- Mode édition inline -->
                    <div *ngIf="editingRoleId === r.id" class="edit-row">
                      <input class="edit-field" type="text" [(ngModel)]="editRole.label"
                             placeholder="Libellé"/>
                      <input class="edit-field mono" type="text" [(ngModel)]="editRole.value"
                             placeholder="Code"/>
                      <button mat-icon-button color="primary" (click)="saveRole(r)"
                              matTooltip="Enregistrer">
                        <mat-icon style="font-size:16px;width:16px;height:16px;">check</mat-icon>
                      </button>
                      <button mat-icon-button (click)="cancelEditRole()"
                              matTooltip="Annuler">
                        <mat-icon style="font-size:16px;width:16px;height:16px;">close</mat-icon>
                      </button>
                    </div>

                    <!-- Affichage normal -->
                    <div *ngIf="editingRoleId !== r.id" class="list-item">
                      <div class="initiale">{{ r.label?.charAt(0)?.toUpperCase() }}</div>
                      <div style="flex:1; min-width:0;">
                        <div style="font-size:13px; font-weight:600; color:#1f2937;">
                          {{ r.label }}
                        </div>
                        <div style="font-size:11px; font-family:monospace; color:#9ca3af;">
                          {{ r.value }}
                        </div>
                      </div>
                      <span *ngIf="r.system === true" class="system-badge">système</span>
                      <div class="action-btns">
                        <button mat-icon-button (click)="startEditRole(r)"
                                matTooltip="Modifier">
                          <mat-icon style="font-size:16px;width:16px;height:16px;color:#6b7280;">
                            edit
                          </mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="deleteRole(r)"
                                matTooltip="Supprimer">
                          <mat-icon style="font-size:16px;width:16px;height:16px;">
                            delete_outline
                          </mat-icon>
                        </button>
                      </div>
                    </div>
                  </ng-container>
                </div>

                <!-- Formulaire ajout fixe -->
                <div class="add-box">
                  <div class="add-title">Ajouter un rôle</div>
                  <div class="field-row">
                    <input class="field" type="text" [(ngModel)]="newRole.label"
                           placeholder="Libellé (Ex: Recruteur)"/>
                    <input class="field mono" type="text" [(ngModel)]="newRole.value"
                           placeholder="Code (Ex: recruteur)"/>
                  </div>
                  <button mat-flat-button color="primary"
                          [disabled]="!newRole.label || !newRole.value || saving"
                          (click)="addRole()"
                          style="width:100%; border-radius:8px;">
                    <mat-spinner *ngIf="saving" diameter="14"
                                 style="display:inline-block;margin-right:6px"></mat-spinner>
                    <mat-icon *ngIf="!saving" style="font-size:16px;width:16px;height:16px;">
                      add
                    </mat-icon>
                    {{ saving ? 'Création...' : 'Ajouter' }}
                  </button>
                </div>
              </ng-container>

              <!-- ══════════ FONCTIONS / STATUTS / ÉTAPES ══════════ -->
              <ng-container *ngIf="!tab.isRoles">

                <!-- Liste scrollable -->
                <div class="list-scroll">
                  <div *ngIf="getItems(tab.key).length === 0" class="empty">
                    Aucun élément.
                  </div>

                  <ng-container *ngFor="let item of getItems(tab.key)">
                    <!-- Mode édition inline -->
                    <div *ngIf="editingItemId === item.id" class="edit-row">
                      <input class="edit-field" type="text" [(ngModel)]="editItem.label"
                             placeholder="Libellé"/>
                      <input class="edit-field mono" type="text" [(ngModel)]="editItem.value"
                             placeholder="Code"/>

                      <!-- Couleur pour statuts en mode édition -->
                      <ng-container *ngIf="tab.key === 'statut_candidat'">
                        <div style="display:flex; gap:4px; margin:0 4px;">
                          <button *ngFor="let c of colorOptions"
                                  type="button" class="color-chip"
                                  [ngClass]="[c.cssClass,
                                    editItem.color === c.value ? 'selected' : '']"
                                  style="padding:2px 7px; font-size:10px;"
                                  (click)="editItem.color = c.value">
                            {{ c.label }}
                          </button>
                        </div>
                      </ng-container>

                      <button mat-icon-button color="primary" (click)="saveItem(item)"
                              matTooltip="Enregistrer">
                        <mat-icon style="font-size:16px;width:16px;height:16px;">check</mat-icon>
                      </button>
                      <button mat-icon-button (click)="cancelEditItem()"
                              matTooltip="Annuler">
                        <mat-icon style="font-size:16px;width:16px;height:16px;">close</mat-icon>
                      </button>
                    </div>

                    <!-- Affichage normal -->
                    <div *ngIf="editingItemId !== item.id" class="list-item">
                      <div *ngIf="tab.key === 'statut_candidat'" class="dot"
                           [ngClass]="{
                             'bg-yellow-400': item.color === 'warning',
                             'bg-green-500':  item.color === 'success',
                             'bg-red-500':    item.color === 'danger',
                             'bg-blue-500':   item.color === 'primary',
                             'bg-gray-400':   !item.color
                           }"></div>

                      <div style="flex:1; min-width:0;">
                        <div style="font-size:13px; font-weight:600; color:#1f2937;">
                          {{ item.label }}
                        </div>
                        <div style="font-size:11px; font-family:monospace; color:#9ca3af;">
                          {{ item.value }}
                        </div>
                      </div>

                      <span *ngIf="tab.key === 'statut_candidat'" class="badge"
                            [ngClass]="configService.getStatutClass(item.color)">
                        {{ item.label }}
                      </span>

                      <div class="action-btns">
                        <button mat-icon-button (click)="startEditItem(item)"
                                matTooltip="Modifier">
                          <mat-icon style="font-size:16px;width:16px;height:16px;color:#6b7280;">
                            edit
                          </mat-icon>
                        </button>
                        <button mat-icon-button color="warn"
                                (click)="deleteItem(tab, item)"
                                matTooltip="Supprimer">
                          <mat-icon style="font-size:16px;width:16px;height:16px;">
                            delete_outline
                          </mat-icon>
                        </button>
                      </div>
                    </div>
                  </ng-container>
                </div>

                <!-- Formulaire ajout fixe -->
                <div class="add-box">
                  <div class="add-title">Ajouter un élément</div>
                  <div class="field-row">
                    <input class="field" type="text"
                           [(ngModel)]="newItems[tab.key].label"
                           placeholder="Libellé"/>
                    <input class="field mono" type="text"
                           [(ngModel)]="newItems[tab.key].value"
                           placeholder="Code interne"/>
                  </div>

                  <ng-container *ngIf="tab.key === 'statut_candidat'">
                    <div style="font-size:11px; color:#6b7280; font-weight:500;
                                margin-bottom:4px;">Couleur du badge</div>
                    <div class="color-row">
                      <button *ngFor="let c of colorOptions" type="button"
                              class="color-chip"
                              [ngClass]="[c.cssClass,
                                newItems[tab.key].color === c.value ? 'selected' : '']"
                              (click)="newItems[tab.key].color = c.value">
                        {{ c.label }}
                      </button>
                    </div>
                    <div *ngIf="newItems[tab.key].label" class="preview-box">
                      <span style="font-size:11px; color:#9ca3af;">Aperçu :</span>
                      <span class="badge"
                            [ngClass]="configService.getStatutClass(newItems[tab.key].color)">
                        {{ newItems[tab.key].label }}
                      </span>
                    </div>
                  </ng-container>

                  <button mat-flat-button color="primary"
                          [disabled]="!newItems[tab.key].label || !newItems[tab.key].value
                                      || saving"
                          (click)="addItem(tab)"
                          style="width:100%; border-radius:8px; margin-top:6px;">
                    <mat-spinner *ngIf="saving" diameter="14"
                                 style="display:inline-block;margin-right:6px"></mat-spinner>
                    <mat-icon *ngIf="!saving" style="font-size:16px;width:16px;height:16px;">
                      add
                    </mat-icon>
                    {{ saving ? 'Création...' : 'Ajouter' }}
                  </button>
                </div>
              </ng-container>

            </ng-container>
          </div>
        </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class PlatformConfigDialogComponent implements OnInit {
  activeTab = 0;
  loading = false;
  saving = false;

  roles: any[] = [];
  newRole = { label: '', value: '' };

  // État édition rôles
  editingRoleId: string | null = null;
  editRole = { label: '', value: '' };

  // État édition items
  editingItemId: string | null = null;
  editItem = { label: '', value: '', color: '' };
dialogTitle = 'Paramètres de la plateforme';

  tabs: Tab[] = [
    { key: 'roles',           label: 'Rôles',     icon: 'badge',  isRoles: true },
    { key: 'fonction',        label: 'Fonctions', icon: 'work',   system: [] },
    { key: 'statut_candidat', label: 'Statuts',   icon: 'flag',   system: [] },
    { key: 'progress_step',   label: 'Étapes',    icon: 'stairs', system: [] },
    { key: 'statut_demande',       label: 'Statuts demande',    icon: 'flag',        system: [] },
  { key: 'type_demande',         label: 'Types demande',      icon: 'category',    system: [] },
  { key: 'destination_demande',  label: 'Destinations',       icon: 'flight_takeoff', system: [] },
  { key: 'statut_professionnel', label: 'Statuts pro',        icon: 'work_history',system: [] },
  ];

  readonly colorOptions: { value: string; label: string; cssClass: string }[] = [
    { value: 'warning', label: 'Attente',  cssClass: 'bg-yellow-100 text-yellow-800' },
    { value: 'success', label: 'Éligible', cssClass: 'bg-green-100 text-green-800'  },
    { value: 'danger',  label: 'Rejeté',   cssClass: 'bg-red-100 text-red-800'      },
    { value: 'primary', label: 'Info',     cssClass: 'bg-blue-100 text-blue-800'    },
  ];

  private data: Record<string, ConfigItem[]> = {};
  newItems: Record<string, { label: string; value: string; color: string }> = {};

constructor(
  public configService: ConfigService,
  private roleService:  RoleService,
  private dialogRef:    MatDialogRef<PlatformConfigDialogComponent>,
  @Optional() @Inject(MAT_DIALOG_DATA) private dialogData: { tabs?: Tab[]; title?: string } | null
) {
  // Une seule fois chaque
  if (this.dialogData?.tabs)  this.tabs         = this.dialogData.tabs;
  if (this.dialogData?.title) this.dialogTitle  = this.dialogData.title;

  this.tabs.filter(t => !t.isRoles).forEach(t => {
    this.newItems[t.key] = { label: '', value: '', color: '' };
  });
}
  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    const configTabs = this.tabs.filter(t => !t.isRoles);
    forkJoin({
      roles: this.roleService.getAll(),
      ...Object.fromEntries(configTabs.map(t => [t.key, this.configService.get(t.key)]))
    }).subscribe({
      next: (results: any) => {
        this.roles = results.roles || [];
        configTabs.forEach(t => { this.data[t.key] = results[t.key] || []; });
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getItems(category: string): ConfigItem[] { return this.data[category] || []; }

  isSystem(tab: Tab, item: ConfigItem): boolean {
    return (tab.system || []).includes(item.value);
  }

  // ── Rôles ────────────────────────────────────────────────────────────
  addRole(): void {
    if (!this.newRole.label || !this.newRole.value) return;
    this.saving = true;
    this.roleService.create({
      value: this.newRole.value.trim().toLowerCase(),
      label: this.newRole.label.trim()
    }).subscribe({
      next: () => {
        this.newRole = { label: '', value: '' };
        this.saving = false;
        this.roleService.getAll().subscribe(r => { this.roles = r; });
      },
      error: () => { this.saving = false; }
    });
  }

  startEditRole(r: any): void {
    this.editingRoleId = r.id;
    this.editRole = { label: r.label, value: r.value };
    this.editingItemId = null; // fermer toute édition item
  }

  saveRole(r: any): void {
    this.roleService.update(r.id, {
      ...r, label: this.editRole.label, value: this.editRole.value
    }).subscribe({
      next: () => {
        this.editingRoleId = null;
        this.roleService.getAll().subscribe(roles => { this.roles = roles; });
      }
    });
  }

  cancelEditRole(): void { this.editingRoleId = null; }

  deleteRole(role: any): void {
    if (!confirm(`Supprimer le rôle "${role.label}" ?`)) return;
    const id = role.id || role._id;
    if (!id) return;
    this.roleService.delete(id).subscribe({
      next: () => this.roleService.getAll().subscribe(r => { this.roles = r; })
    });
  }

  // ── Config items ─────────────────────────────────────────────────────
  addItem(tab: Tab): void {
    const form = this.newItems[tab.key];
    if (!form.label || !form.value) return;
    this.saving = true;
    this.configService.create({
      category: tab.key,
      value:    form.value.trim().toLowerCase(),
      label:    form.label.trim(),
      color:    form.color || undefined,
      active:   true,
    }).subscribe({
      next: () => {
        this.newItems[tab.key] = { label: '', value: '', color: '' };
        this.saving = false;
        this.refreshTab(tab.key);
      },
      error: () => { this.saving = false; }
    });
  }

  startEditItem(item: ConfigItem): void {
    this.editingItemId = item.id;
    this.editItem = { label: item.label, value: item.value, color: item.color || '' };
    this.editingRoleId = null; // fermer toute édition rôle
  }

  saveItem(item: ConfigItem): void {
    this.configService.update(item.id, {
      ...item,
      label: this.editItem.label,
      value: this.editItem.value,
      color: this.editItem.color || undefined,
    }).subscribe({
      next: () => {
        this.editingItemId = null;
        this.refreshTab(item.category);
      }
    });
  }

  cancelEditItem(): void { this.editingItemId = null; }

  deleteItem(tab: Tab, item: ConfigItem): void {
    if (!confirm(`Supprimer "${item.label}" ?`)) return;
    this.configService.delete(item.id, tab.key).subscribe({
      next: () => this.refreshTab(tab.key)
    });
  }

  private refreshTab(category: string): void {
    this.configService.invalidate(category);
    this.configService.get(category).subscribe(items => {
      this.data[category] = items;
    });
  }

  close(): void { this.dialogRef.close(); }
}