import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { DemandeService } from 'src/app/services/demande.service';
import { Demande } from 'src/app/models/demande.model';

@Component({
  selector: 'app-demandes',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, FormsModule],
  templateUrl: './demandes.component.html',
})
export class DemandesComponent implements OnInit {
  demandes: Demande[] = [];
  loading = false;
  total = 0;
  page = 0;
  limit = 10;
  selectedStatus = '';

  displayedColumns = [
    'uniqueId',
    'user',
    'type',
    'status',
    'journeesDestination',
    'niveauEtude',
    'createdAt',
    'actions',
  ];

  statuts = [
    { value: '', label: 'Tous' },
    { value: 'pre_selection', label: 'Pré-sélection' },
    { value: 'selection', label: 'Sélection' },
    { value: 'accepte', label: 'Accepté' },
    { value: 'refuse', label: 'Refusé' },
    { value: 'en_attente', label: 'En attente' },
  ];

  constructor(private demandeService: DemandeService) {}

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes(): void {
    this.loading = true;
    this.demandeService
      .getAll(this.page, this.limit, this.selectedStatus || undefined)
      .subscribe({
        next: (res) => {
          this.demandes = res.data;
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
    this.loadDemandes();
  }

  onPageChange(event: any): void {
    this.page = event.pageIndex;
    this.limit = event.pageSize;
    this.loadDemandes();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'accepte': return 'bg-green-100 text-green-700';
      case 'refuse': return 'bg-red-100 text-red-700';
      case 'pre_selection': return 'bg-blue-100 text-blue-700';
      case 'selection': return 'bg-purple-100 text-purple-700';
      case 'en_attente': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'accepte': return 'Accepté';
      case 'refuse': return 'Refusé';
      case 'pre_selection': return 'Pré-sélection';
      case 'selection': return 'Sélection';
      case 'en_attente': return 'En attente';
      default: return status;
    }
  }

  updateStatus(id: string, status: string): void {
    this.demandeService.updateStatus(id, status).subscribe({
      next: () => this.loadDemandes(),
    });
  }

  deleteDemande(id: string): void {
    if (confirm('Confirmer la suppression ?')) {
      this.demandeService.delete(id).subscribe({
        next: () => this.loadDemandes(),
      });
    }
  }
}