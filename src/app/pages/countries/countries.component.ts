import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { CountryService } from 'src/app/services/country.service';
import { Country } from 'src/app/models/country.model';

@Component({
  selector: 'app-countries',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, FormsModule],
  templateUrl: './countries.component.html',
})
export class CountriesComponent implements OnInit {
  countries: Country[] = [];
  loading = false;
  total = 0;
  page = 0;
  limit = 10;

  displayedColumns = [
    'code',
    'name',
    'region',
    'jobCount',
    'isActive',
    'lastSynced',
    'actions',
  ];

  constructor(private countryService: CountryService) {}

  ngOnInit(): void {
    this.loadCountries();
  }

  loadCountries(): void {
    this.loading = true;
    this.countryService.getAll(this.page, this.limit).subscribe({
      next: (res) => {
        this.countries = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onPageChange(event: any): void {
    this.page = event.pageIndex;
    this.limit = event.pageSize;
    this.loadCountries();
  }

  toggleActive(country: Country): void {
    this.countryService
      .toggleActive(country.id, !country.isActive)
      .subscribe({
        next: () => this.loadCountries(),
      });
  }

  getActiveClass(isActive: boolean): string {
    return isActive
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  }
}