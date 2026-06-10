import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent implements OnInit {
  user: any = null; // Changé en 'any' pour s'adapter parfaitement au JSON Spring Boot
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUser(userId);
    }
  }

  loadUser(id: string): void {
    this.loading = true;
    this.userService.getById(id).subscribe({
      next: (res) => {
        this.user = res.data; // Récupère l'objet utilisateur complet envoyé par l'ApiResponse
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l\'utilisateur', err);
        this.loading = false;
      }
    });
  }
}