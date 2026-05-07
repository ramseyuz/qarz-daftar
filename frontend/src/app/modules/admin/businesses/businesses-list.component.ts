import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { debounceTime, Subject } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';
import { BusinessesService } from './businesses.service';
import { BusinessFormDialogComponent } from './business-form-dialog.component';

@Component({
    selector  : 'app-businesses-list',
    standalone: true,
    imports   : [
        CommonModule, FormsModule,
        MatButtonModule, MatDialogModule, MatFormFieldModule,
        MatIconModule, MatInputModule, MatProgressSpinnerModule,
        MatTableModule,
    ],
    templateUrl: './businesses-list.component.html',
})
export class BusinessesListComponent implements OnInit
{
    businesses: any[] = [];
    loading           = true;
    searchValue       = '';
    isSuperAdmin      = false;
    isOwner           = false;

    get displayedColumns(): string[]
    {
        return this.isSuperAdmin
            ? ['name', 'phone', 'address', 'employees', 'total_debt', 'total_remaining', 'is_active', 'actions']
            : ['name', 'phone', 'address', 'employees', 'total_debt', 'total_remaining', 'is_active', 'actions'];
    }

    private _search$ = new Subject<string>();

    constructor(
        private _service: BusinessesService,
        private _dialog : MatDialog,
        private _auth   : AuthService,
    ) {}

    ngOnInit(): void
    {
        this.isSuperAdmin = this._auth.isSuperAdmin;
        this.isOwner      = this._auth.isOwner;
        this._load();
        this._search$.pipe(debounceTime(300)).subscribe(q => this._load(q));
    }

    private _load(search?: string): void
    {
        this.loading = true;
        this._service.getAll({ search }).subscribe({
            next : (res) => { this.businesses = res.results ?? res; this.loading = false; },
            error: ()    => { this.loading = false; },
        });
    }

    onSearch(value: string): void { this._search$.next(value); }

    openCreate(): void
    {
        this._dialog.open(BusinessFormDialogComponent, {
            width: '500px',
            data : { _isSuperAdmin: this.isSuperAdmin },
        }).afterClosed().subscribe(ok => { if (ok) { this._load(this.searchValue); } });
    }

    openEdit(b: any): void
    {
        this._dialog.open(BusinessFormDialogComponent, {
            width: '500px',
            data : { ...b, _isSuperAdmin: this.isSuperAdmin },
        }).afterClosed().subscribe(ok => { if (ok) { this._load(this.searchValue); } });
    }

    delete(b: any): void
    {
        if (!confirm(`Delete "${b.name}"? This cannot be undone.`)) { return; }
        this._service.delete(b.id).subscribe({
            next : () => this._load(this.searchValue),
            error: (err) => alert(err?.error?.detail ?? 'Delete failed.'),
        });
    }
}
