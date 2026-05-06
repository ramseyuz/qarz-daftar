import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { CustomersService } from './customers.service';
import { CustomerFormDialogComponent } from './customer-form-dialog.component';
import { debounceTime, Subject } from 'rxjs';

@Component({
    selector  : 'app-customers-list',
    standalone: true,
    imports   : [
        CommonModule, FormsModule, ReactiveFormsModule,
        MatButtonModule, MatDialogModule, MatFormFieldModule,
        MatIconModule, MatInputModule, MatProgressSpinnerModule,
        MatTableModule, RouterLink,
    ],
    templateUrl: './customers-list.component.html',
})
export class CustomersListComponent implements OnInit
{
    customers: any[]  = [];
    loading           = true;
    searchValue       = '';
    isSuperAdmin      = false;
    displayedColumns  = ['full_name', 'phone', 'total_debt', 'total_remaining', 'is_active', 'actions'];

    private _search$ = new Subject<string>();

    constructor(
        private _customersService: CustomersService,
        private _dialog: MatDialog,
        private _auth : AuthService,
    ) {}

    ngOnInit(): void
    {
        this.isSuperAdmin = this._auth.isSuperAdmin;
        if (this.isSuperAdmin) {
            this.displayedColumns = ['business_name', 'full_name', 'phone', 'total_debt', 'total_remaining', 'is_active', 'actions'];
        }
        this._load();
        this._search$.pipe(debounceTime(300)).subscribe(q => this._load(q));
    }

    private _load(search?: string): void
    {
        this.loading = true;
        this._customersService.getAll({ search }).subscribe({
            next : (res) => { this.customers = res.results ?? res; this.loading = false; },
            error: ()    => { this.loading = false; },
        });
    }

    onSearch(value: string): void
    {
        this._search$.next(value);
    }

    openCreate(): void
    {
        const ref = this._dialog.open(CustomerFormDialogComponent, { width: '480px' });
        ref.afterClosed().subscribe(result => { if (result) { this._load(this.searchValue); } });
    }

    openEdit(customer: any): void
    {
        const ref = this._dialog.open(CustomerFormDialogComponent, { width: '480px', data: customer });
        ref.afterClosed().subscribe(result => { if (result) { this._load(this.searchValue); } });
    }

    delete(customer: any): void
    {
        if (!confirm(`Delete ${customer.full_name}?`)) { return; }
        this._customersService.delete(customer.id).subscribe(() => this._load(this.searchValue));
    }
}
