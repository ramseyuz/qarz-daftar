import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SubscriptionsService } from './subscriptions.service';

@Component({
    selector  : 'app-subscription-form-dialog',
    standalone: true,
    imports   : [CommonModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatDialogModule,
                 MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule],
    template: `
        <h2 mat-dialog-title>{{ data?.id ? 'Edit Subscription' : 'Assign Subscription' }}</h2>
        <mat-dialog-content style="min-width:440px">
            <form [formGroup]="form" class="flex flex-col gap-4 pt-2">
                <mat-form-field *ngIf="!data?.id">
                    <mat-label>Business</mat-label>
                    <mat-select formControlName="business">
                        <mat-option *ngFor="let b of businesses" [value]="b.id">{{ b.name }}</mat-option>
                    </mat-select>
                    <mat-error>Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Plan</mat-label>
                    <mat-select formControlName="plan" (selectionChange)="onPlanChange($event.value)">
                        <mat-option *ngFor="let p of plans" [value]="p.id">
                            {{ p.name }} — {{ p.price | number:'1.0-0' }} UZS / {{ p.duration_days }}d
                        </mat-option>
                    </mat-select>
                    <mat-error>Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Start Date</mat-label>
                    <input matInput formControlName="start_date" type="date" (change)="updateEndDate()">
                    <mat-error>Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>End Date</mat-label>
                    <input matInput formControlName="end_date" type="date">
                    <mat-hint>Auto-filled from plan duration. Adjust manually if needed.</mat-hint>
                    <mat-error>Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Notes</mat-label>
                    <textarea matInput formControlName="notes" rows="2"></textarea>
                </mat-form-field>
            </form>
            <p *ngIf="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button mat-dialog-close>Cancel</button>
            <button mat-flat-button color="primary" [disabled]="form.invalid || saving" (click)="save()">
                <mat-progress-spinner *ngIf="saving" [diameter]="18" mode="indeterminate"></mat-progress-spinner>
                <span *ngIf="!saving">{{ data?.id ? 'Save' : 'Assign' }}</span>
            </button>
        </mat-dialog-actions>
    `,
})
export class SubscriptionFormDialogComponent implements OnInit
{
    form: UntypedFormGroup;
    saving     = false;
    error      = '';
    plans: any[]      = [];
    businesses: any[] = [];
    private _selectedPlanDays = 0;

    constructor(
        private _fb: UntypedFormBuilder,
        private _service: SubscriptionsService,
        private _ref: MatDialogRef<SubscriptionFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit(): void
    {
        const today = new Date().toISOString().split('T')[0];
        this.form = this._fb.group({
            business  : [this.data?.business   ?? null, Validators.required],
            plan      : [this.data?.plan        ?? null, Validators.required],
            start_date: [this.data?.start_date  ?? today, Validators.required],
            end_date  : [this.data?.end_date    ?? '',   Validators.required],
            notes     : [this.data?.notes       ?? ''],
        });

        this._service.getPlans().subscribe({ next: (r) => { this.plans = r.results ?? r; } });
        if (!this.data?.id)
        {
            this._service.getBusinesses().subscribe({ next: (r) => { this.businesses = r.results ?? r; } });
        }
    }

    onPlanChange(planId: string): void
    {
        const plan = this.plans.find(p => p.id === planId);
        if (plan) { this._selectedPlanDays = plan.duration_days; this.updateEndDate(); }
    }

    updateEndDate(): void
    {
        if (!this._selectedPlanDays) { return; }
        const start = new Date(this.form.value.start_date);
        if (isNaN(start.getTime())) { return; }
        start.setDate(start.getDate() + this._selectedPlanDays);
        this.form.patchValue({ end_date: start.toISOString().split('T')[0] });
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
            error: (err) => { this.saving = false; this.error = err?.error?.detail ?? JSON.stringify(err?.error) ?? 'Error'; },
        });
    }
}


@Component({
    selector   : 'app-subscriptions-list',
    standalone : true,
    imports    : [CommonModule, FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule,
                  MatIconModule, MatInputModule, MatProgressSpinnerModule, MatTableModule, MatTooltipModule],
    templateUrl: './subscriptions-list.component.html',
})
export class SubscriptionsListComponent implements OnInit
{
    subscriptions: any[] = [];
    loading              = true;
    displayedColumns     = ['business', 'plan', 'dates', 'status', 'actions'];

    constructor(
        private _service: SubscriptionsService,
        private _dialog : MatDialog,
    ) {}

    ngOnInit(): void { this._load(); }

    private _load(): void
    {
        this.loading = true;
        this._service.getAll().subscribe({
            next : (res) => { this.subscriptions = res.results ?? res; this.loading = false; },
            error: ()    => { this.loading = false; },
        });
    }

    openCreate(): void
    {
        this._dialog.open(SubscriptionFormDialogComponent, { width: '480px', data: null })
            .afterClosed().subscribe(ok => { if (ok) { this._load(); } });
    }

    openEdit(s: any): void
    {
        this._dialog.open(SubscriptionFormDialogComponent, { width: '480px', data: s })
            .afterClosed().subscribe(ok => { if (ok) { this._load(); } });
    }

    delete(s: any): void
    {
        if (!confirm(`Remove subscription for "${s.business_name}"?`)) { return; }
        this._service.delete(s.id).subscribe({ next: () => this._load() });
    }

    statusClass(s: any): string
    {
        if (!s.is_active) { return 'bg-gray-100 text-gray-500'; }
        return s.is_expired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700';
    }

    statusLabel(s: any): string
    {
        if (!s.is_active) { return 'Inactive'; }
        if (s.is_expired) { return 'Expired'; }
        return `Active · ${s.days_remaining}d left`;
    }
}
