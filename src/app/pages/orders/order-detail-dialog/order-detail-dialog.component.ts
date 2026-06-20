import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { Order } from 'src/app/models/order.model';

@Component({
  selector: 'app-order-detail-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon class="text-blue-600">receipt_long</mat-icon>
      Détails de la commande
    </h2>

    <mat-dialog-content class="space-y-4 min-w-[320px]">

      <!-- Identifiants -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-2">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Identifiants</p>
        <div class="grid grid-cols-1 gap-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Order ID</span>
            <span class="font-mono text-xs text-gray-700">{{ data.orderId }}</span>
          </div>
          <div *ngIf="data.bookingId" class="flex justify-between">
            <span class="text-gray-500">Booking ID</span>
            <span class="font-mono text-xs text-gray-700">{{ data.bookingId }}</span>
          </div>
          <div *ngIf="data.userId" class="flex justify-between">
            <span class="text-gray-500">User ID</span>
            <span class="font-mono text-xs text-gray-700">{{ data.userId }}</span>
          </div>
        </div>
      </div>

      <!-- Type & Statut -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-2">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Type & Statut</p>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="flex justify-between col-span-1">
            <span class="text-gray-500">Type</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-medium" [ngClass]="getTypeClass(data.type)">
              {{ data.type }}
            </span>
          </div>
          <div class="flex justify-between col-span-1">
            <span class="text-gray-500">Statut</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-medium" [ngClass]="getStatusClass(data.status)">
              {{ getStatusLabel(data.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Paiement -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-2">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Paiement</p>
        <div class="grid grid-cols-1 gap-2 text-sm">
          <div *ngIf="data.price != null" class="flex justify-between">
            <span class="text-gray-500">Prix</span>
            <span class="font-semibold text-gray-800">{{ data.price }} {{ data.currency || '' }}</span>
          </div>
          <div *ngIf="data.amount != null" class="flex justify-between">
            <span class="text-gray-500">Montant</span>
            <span class="font-semibold text-gray-800">{{ data.amount }} {{ data.currency || '' }}</span>
          </div>
          <div *ngIf="data.amountInTND != null" class="flex justify-between">
            <span class="text-gray-500">Montant (TND)</span>
            <span class="font-semibold text-gray-800">{{ data.amountInTND }} TND</span>
          </div>
          <div *ngIf="data.country" class="flex justify-between">
            <span class="text-gray-500">Pays</span>
            <span class="text-gray-700">{{ data.country }}</span>
          </div>
          <div *ngIf="data.description" class="flex justify-between">
            <span class="text-gray-500">Description</span>
            <span class="text-gray-700 text-right">{{ data.description }}</span>
          </div>
        </div>
      </div>

      <!-- Dates -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-2">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dates</p>
        <div class="grid grid-cols-1 gap-2 text-sm">
          <div *ngIf="data.date" class="flex justify-between">
            <span class="text-gray-500">Date / Heure</span>
            <span class="text-gray-700">{{ data.date }} {{ data.time }}</span>
          </div>
          <div *ngIf="data.createdAt" class="flex justify-between">
            <span class="text-gray-500">Créé le</span>
            <span class="text-gray-700">{{ data.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <div *ngIf="data.updatedAt" class="flex justify-between">
            <span class="text-gray-500">Mis à jour le</span>
            <span class="text-gray-700">{{ data.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
        </div>
      </div>

    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="dialogRef.close()">Fermer</button>
    </mat-dialog-actions>
  `,
})
export class OrderDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<OrderDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Order
  ) {}

  getTypeClass(type: string): string {
    switch (type) {
      case 'premium': return 'bg-purple-100 text-purple-700';
      case 'pro': return 'bg-indigo-100 text-indigo-700';
      case 'standard': return 'bg-cyan-100 text-cyan-700';
      case 'balance_topup': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
      case 'paid': return 'bg-green-100 text-green-700';
      case 'created': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Complété';
      case 'paid': return 'Payé';
      case 'created': return 'Créé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  }
}