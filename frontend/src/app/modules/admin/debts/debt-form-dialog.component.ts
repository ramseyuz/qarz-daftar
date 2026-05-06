import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { DebtsService } from './debts.service';

@Component({
    selector  : 'app-debt-form-dialog',
    standalone: true,
    imports   : [
        CommonModule, FormsModule, ReactiveFormsModule,
        MatButtonModule, MatDatepickerModule, MatDialogModule,
        MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule,
    ],
    template: `
        <h2 mat-dialog-title>{{ isEdit ? 'Edit Debt' : 'New Debt' }}</h2>
        <mat-dialog-content>
            <form [formGroup]="form" class="flex flex-col gap-4 pt-2">
                <mat-form-field *ngIf="!isEdit">
                    <mat-label>Customer</mat-label>
                    <mat-select formControlName="customer">
                        <mat-option *ngFor="let c of customers" [value]="c.id">{{ c.full_name }}</mat-option>
                    </mat-select>
                    <mat-error *ngIf="form.get('customer').hasError('required')">Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Total Amount</mat-label>
                    <input matInput type="number" formControlName="total_amount">
                    <mat-error *ngIf="form.get('total_amount').hasError('required')">Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Description</mat-label>
                    <textarea matInput formControlName="description" rows="2"></textarea>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Due Date</mat-label>
                    <input matInput type="date" formControlName="due_date">
                </mat-form-field>
            </form>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button mat-dialog-close>Cancel</button>
            <button mat-flat-button color="primary" [disabled]="form.invalid || saving" (click)="save()">
                <mat-progress-spinner *ngIf="saving" [diameter]="18" mode="indeterminate"></mat-progress-spinner>
                <span *ngIf="!saving">{{ isEdit ? 'Save' : 'Create' }}</span>
            </button>
        </mat-dialog-actions>
    `,
})
export class DebtFormDialogComponent implements OnInit
{
    form: UntypedFormGroup;
    saving    = false;
    isEdit    = false;
    customers: any[] = [];

    constructor(
        private _fb: UntypedFormBuilder,
        private _service: DebtsService,
        private _dialogRef: MatDialogRef<DebtFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit(): void
    {
        this.isEdit = !!this.data;

        this.form = this._fb.group({
            customer    : [this.data?.customer ?? null, this.isEdit ? [] : [Validators.required]],
            total_amount: [this.data?.total_amount ?? null, [Validators.required, Validators.min(0)]],
            description : [this.data?.description ?? ''],
            due_date    : [this.data?.due_date ?? ''],
        });

        if (!this.isEdit)
        {
            this._service.getCustomers().subscribe(res =>
            {
                this.customers = res.results ?? res;
            });
        }
    }

    save(): void
    {
        if (this.form.invalid) { return; }
        this.saving = true;

        const payload = { ...this.form.value };
        if (!payload.due_date) { delete payload.due_date; }

        const req = this.isEdit
            ? this._service.update(this.data.id, payload)
            : this._service.create(payload);

        req.subscribe({
            next : () => { this.saving = false; this._dialogRef.close(true); },
            error: () => { this.saving = false; },
        });
    }
}
