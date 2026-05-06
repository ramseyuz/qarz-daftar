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
import { AuthService } from 'app/core/auth/auth.service';
import { ProductsService } from './products.service';
import { ProductFormDialogComponent } from './product-form-dialog.component';
import { debounceTime, Subject } from 'rxjs';

@Component({
    selector  : 'app-products-list',
    standalone: true,
    imports   : [
        CommonModule, FormsModule, ReactiveFormsModule,
        MatButtonModule, MatDialogModule, MatFormFieldModule,
        MatIconModule, MatInputModule, MatProgressSpinnerModule, MatTableModule,
    ],
    templateUrl: './products-list.component.html',
})
export class ProductsListComponent implements OnInit
{
    products: any[]  = [];
    loading          = true;
    searchValue      = '';
    isSuperAdmin     = false;
    displayedColumns = ['name', 'unit', 'price', 'actions'];

    private _search$ = new Subject<string>();

    constructor(
        private _service: ProductsService,
        private _dialog : MatDialog,
        private _auth   : AuthService,
    ) {}

    ngOnInit(): void
    {
        this.isSuperAdmin = this._auth.isSuperAdmin;
        if (this.isSuperAdmin) {
            this.displayedColumns = ['business_name', 'name', 'unit', 'price', 'actions'];
        }
        this._load();
        this._search$.pipe(debounceTime(300)).subscribe(q => this._load(q));
    }

    private _load(search?: string): void
    {
        this.loading = true;
        this._service.getAll({ search }).subscribe({
            next : (res) => { this.products = res.results ?? res; this.loading = false; },
            error: ()    => { this.loading = false; },
        });
    }

    onSearch(value: string): void { this._search$.next(value); }

    openCreate(): void
    {
        const ref = this._dialog.open(ProductFormDialogComponent, { width: '480px' });
        ref.afterClosed().subscribe(r => { if (r) { this._load(this.searchValue); } });
    }

    openEdit(item: any): void
    {
        const ref = this._dialog.open(ProductFormDialogComponent, { width: '480px', data: item });
        ref.afterClosed().subscribe(r => { if (r) { this._load(this.searchValue); } });
    }

    delete(item: any): void
    {
        if (!confirm(`Delete ${item.name}?`)) { return; }
        this._service.delete(item.id).subscribe(() => this._load(this.searchValue));
    }
}
