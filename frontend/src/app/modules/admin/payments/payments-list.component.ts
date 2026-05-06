import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from 'app/core/auth/auth.service';
import { PaymentsService } from './payments.service';
import { PaymentFormDialogComponent } from './payment-form-dialog.component';

@Component({
    selector  : 'app-payments-list',
    standalone: true,
    imports   : [
        CommonModule,
        MatButtonModule, MatDialogModule, MatIconModule,
        MatProgressSpinnerModule, MatTableModule,
    ],
    templateUrl: './payments-list.component.html',
})
export class PaymentsListComponent implements OnInit
{
    payments: any[]  = [];
    loading          = true;
    isSuperAdmin     = false;
    displayedColumns = ['debt_customer', 'amount', 'note', 'created_at', 'actions'];

    constructor(
        private _service: PaymentsService,
        private _dialog : MatDialog,
        private _auth   : AuthService,
    ) {}

    ngOnInit(): void
    {
        this.isSuperAdmin = this._auth.isSuperAdmin;
        if (this.isSuperAdmin) {
            this.displayedColumns = ['business_name', 'debt_customer', 'amount', 'note', 'created_at', 'actions'];
        }
        this._load();
    }

    private _load(): void
    {
        this.loading = true;
        this._service.getAll().subscribe({
            next : (res) => { this.payments = res.results ?? res; this.loading = false; },
            error: ()    => { this.loading = false; },
        });
    }

    openCreate(): void
    {
        const ref = this._dialog.open(PaymentFormDialogComponent, { width: '480px' });
        ref.afterClosed().subscribe(r => { if (r) { this._load(); } });
    }

    delete(p: any): void
    {
        if (!confirm('Delete this payment?')) { return; }
        this._service.delete(p.id).subscribe(() => this._load());
    }
}
