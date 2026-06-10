import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { OrderService } from 'src/app/services/order.service';
import { Order } from 'src/app/models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, FormsModule],
  templateUrl: './orders.component.html',
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  total = 0;
  page = 0;
  limit = 10;
  selectedStatus = '';

  displayedColumns = [
    'orderId',
    'bookingId',
    'type',
    'status',
    'date',
    'actions',
  ];

  statuts = [
    { value: '', label: 'Tous' },
    { value: 'created', label: 'Créé' },
    { value: 'paid', label: 'Payé' },
    { value: 'cancelled', label: 'Annulé' },
    { value: 'completed', label: 'Complété' },
  ];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService
      .getAll(this.page, this.limit, this.selectedStatus || undefined)
      .subscribe({
        next: (res) => {
          this.orders = res.data;
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
    this.loadOrders();
  }

  onPageChange(event: any): void {
    this.page = event.pageIndex;
    this.limit = event.pageSize;
    this.loadOrders();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'paid': return 'bg-blue-100 text-blue-700';
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

  getTypeClass(type: string): string {
    return type === 'premium'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-blue-100 text-blue-700';
  }

  updateStatus(id: string, status: string): void {
    this.orderService.updateStatus(id, status).subscribe({
      next: () => this.loadOrders(),
    });
  }

  deleteOrder(id: string): void {
    if (confirm('Confirmer la suppression ?')) {
      this.orderService.delete(id).subscribe({
        next: () => this.loadOrders(),
      });
    }
  }
}