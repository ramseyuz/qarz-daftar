import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from 'app/core/auth/auth.service';
import { DebtsService } from './debts.service';
import { DebtFormDialogComponent } from './debt-form-dialog.component';
import { debounceTime, Subject } from 'rxjs';

@Component({
    selector  : 'app-debts-list',
    standalone: true,
    imports   : [
        CommonModule, FormsModule,
        MatButtonModule, MatDialogModule, MatFormFieldModule,
        MatIconModule, MatInputModule, MatProgressSpinnerModule,
        MatSelectModule, MatTableModule,
    ],
    templateUrl: './debts-list.component.html',
})
export class DebtsListComponent implements OnInit
{
    debts: any[]     = [];
    loading          = true;
    searchValue      = '';
    statusFilter     = '';
    isSuperAdmin     = false;
    displayedColumns = ['customer_name', 'total_amount', 'paid_amount', 'remaining_amount', 'status', 'due_date', 'actions'];

    private _search$ = new Subject<string>();

    constructor(
        private _service: DebtsService,
        private _dialog : MatDialog,
        private _auth   : AuthService,
    ) {}

    ngOnInit(): void
    {
        this.isSuperAdmin = this._auth.isSuperAdmin;
        if (this.isSuperAdmin) {
            this.displayedColumns = ['business_name', 'customer_name', 'total_amount', 'paid_amount', 'remaining_amount', 'status', 'due_date', 'actions'];
        }
        this._load();
        this._search$.pipe(debounceTime(300)).subscribe(() => this._load());
    }

    exportExcel(): void { this._service.exportExcel(); }

    private _load(): void
    {
        this.loading = true;
        this._service.getAll({ search: this.searchValue, status: this.statusFilter || undefined }).subscribe({
            next : (res) => { this.debts = res.results ?? res; this.loading = false; },
            error: ()    => { this.loading = false; },
        });
    }

    onSearch(value: string): void { this.searchValue = value; this._search$.next(value); }

    onStatusChange(): void { this._load(); }

    openCreate(): void
    {
        const ref = this._dialog.open(DebtFormDialogComponent, { width: '560px' });
        ref.afterClosed().subscribe(r => { if (r) { this._load(); } });
    }

    openEdit(debt: any): void
    {
        const ref = this._dialog.open(DebtFormDialogComponent, { width: '560px', data: debt });
        ref.afterClosed().subscribe(r => { if (r) { this._load(); } });
    }

    delete(debt: any): void
    {
        if (!confirm('Delete this debt?')) { return; }
        this._service.delete(debt.id).subscribe(() => this._load());
    }
}
