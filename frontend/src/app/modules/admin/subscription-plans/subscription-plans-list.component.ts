import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Inject } from '@angular/core';
import { SubscriptionPlansService } from './subscription-plans.service';

@Component({
    selector  : 'app-plan-form-dialog',
    standalone: true,
    imports   : [CommonModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatDialogModule,
                 MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule],
    template: `
        <h2 mat-dialog-title>{{ data?.id ? 'Edit Plan' : 'New Plan' }}</h2>
        <mat-dialog-content style="min-width:420px">
            <form [formGroup]="form" class="flex flex-col gap-4 pt-2">
                <mat-form-field>
                    <mat-label>Plan Name</mat-label>
                    <input matInput formControlName="name">
                    <mat-error>Required</mat-error>
                </mat-form-field>
                <div class="grid grid-cols-2 gap-4">
                    <mat-form-field>
                        <mat-label>Price (UZS)</mat-label>
                        <input matInput formControlName="price" type="number" min="0">
                    </mat-form-field>
                    <mat-form-field>
                        <mat-label>Duration (days)</mat-label>
                        <input matInput formControlName="duration_days" type="number" min="1">
                    </mat-form-field>
                </div>
                <div class="grid grid-cols-3 gap-3">
                    <mat-form-field>
                        <mat-label>Max Employees</mat-label>
                        <input matInput formControlName="max_users" type="number" min="1">
                    </mat-form-field>
                    <mat-form-field>
                        <mat-label>Max Customers</mat-label>
                        <input matInput formControlName="max_customers" type="number" min="1">
                    </mat-form-field>
                    <mat-form-field>
                        <mat-label>Max Debts</mat-label>
                        <input matInput formControlName="max_debts" type="number" min="1">
                    </mat-form-field>
                </div>
                <mat-form-field>
                    <mat-label>Description</mat-label>
                    <textarea matInput formControlName="description" rows="2"></textarea>
                </mat-form-field>
            </form>
            <p *ngIf="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button mat-dialog-close>Cancel</button>
            <button mat-flat-button color="primary" [disabled]="form.invalid || saving" (click)="save()">
                <mat-progress-spinner *ngIf="saving" [diameter]="18" mode="indeterminate"></mat-progress-spinner>
                <span *ngIf="!saving">{{ data?.id ? 'Save' : 'Create' }}</span>
            </button>
        </mat-dialog-actions>
    `,
})
export class PlanFormDialogComponent implements OnInit
{
    form: UntypedFormGroup;
    saving = false;
    error  = '';

    constructor(
        private _fb: UntypedFormBuilder,
        private _service: SubscriptionPlansService,
        private _ref: MatDialogRef<PlanFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit(): void
    {
        this.form = this._fb.group({
            name         : [this.data?.name          ?? '', Validators.required],
            price        : [this.data?.price          ?? 0,  [Validators.required, Validators.min(0)]],
            duration_days: [this.data?.duration_days  ?? 30, [Validators.required, Validators.min(1)]],
            max_users    : [this.data?.max_users      ?? 5,  [Validators.required, Validators.min(1)]],
            max_customers: [this.data?.max_customers  ?? 100,[Validators.required, Validators.min(1)]],
            max_debts    : [this.data?.max_debts      ?? 500,[Validators.required, Validators.min(1)]],
            description  : [this.data?.description    ?? ''],
        });
    }

    save(): void
    {
        if (this.form.invalid) { return; }
        this.saving = true;
        const req = this.data?.id
            ? this._service.update(this.data.id, this.form.value)
            : this._service.create(this.form.value);
        req.subscribe({
            next : () => { this.saving = false; this._ref.close(true); },
            error: (err) => { this.saving = false; this.error = err?.error?.detail ?? 'Error'; },
        });
    }
}


@Component({
    selector   : 'app-subscription-plans-list',
    standalone : true,
    imports    : [CommonModule, MatButtonModule, MatDialogModule, MatIconModule,
                  MatProgressSpinnerModule, MatTableModule, MatTooltipModule],
    templateUrl: './subscription-plans-list.component.html',
})
export class SubscriptionPlansListComponent implements OnInit
{
    plans: any[] = [];
    loading      = true;
    displayedColumns = ['name', 'price', 'duration', 'limits', 'actions'];

    constructor(
        private _service: SubscriptionPlansService,
        private _dialog : MatDialog,
    ) {}

    ngOnInit(): void { this._load(); }

    private _load(): void
    {
        this.loading = true;
        this._service.getAll().subscribe({
            next : (res) => { this.plans = res.results ?? res; this.loading = false; },
            error: ()    => { this.loading = false; },
        });
    }

    openCreate(): void
    {
        this._dialog.open(PlanFormDialogComponent, { width: '520px', data: null })
            .afterClosed().subscribe(ok => { if (ok) { this._load(); } });
    }

    openEdit(p: any): void
    {
        this._dialog.open(PlanFormDialogComponent, { width: '520px', data: p })
            .afterClosed().subscribe(ok => { if (ok) { this._load(); } });
    }

    delete(p: any): void
    {
        if (!confirm(`Delete plan "${p.name}"?`)) { return; }
        this._service.delete(p.id).subscribe({
            next : () => this._load(),
            error: (err) => alert(err?.error?.detail ?? 'Cannot delete — may be in use.'),
        });
    }
}
