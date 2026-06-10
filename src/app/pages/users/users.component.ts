import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user.model';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, FormsModule],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = false;
  total = 0;
  page = 0;
  limit = 10;
  selectedRole = 'candidat';

  displayedColumns = [
    'uniqueId',
    'nom',
    'email',
    'role',
    'pays',
    'candidateVerificationStatus',
    'createdAt',
    'actions',
  ];

  roles = [
    { value: '', label: 'Tous' },
    { value: 'candidat', label: 'Candidat' },
    { value: 'admin', label: 'Admin' },
    { value: 'company', label: 'Entreprise' },
  ];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAll(this.page, this.limit, this.selectedRole || undefined)
      .subscribe({
        next: (res) => {
          this.users = res.data;
          this.total = res.total;
          this.loading = false;
        },
        error: () => { this.loading = false; },
      });
  }

  onRoleChange(): void {
    this.page = 0;
    this.loadUsers();
  }

  onPageChange(event: any): void {
    this.page = event.pageIndex;
    this.limit = event.pageSize;
    this.loadUsers();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'verified': return 'primary';
      case 'pending': return 'warn';
      case 'rejected': return 'accent';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'verified': return 'Vérifié';
      case 'pending': return 'En attente';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'candidat': return 'Candidat';
      case 'admin': return 'Admin';
      case 'company': return 'Entreprise';
      default: return role;
    }
  }

  deleteUser(id: string): void {
    if (confirm('Confirmer la suppression ?')) {
      this.userService.delete(id).subscribe({
        next: () => this.loadUsers(),
      });
    }
  }
}