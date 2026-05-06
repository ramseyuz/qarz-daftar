import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { PaymentsService } from './payments.service';

@Component({
    selector  : 'app-payment-form-dialog',
    standalone: true,
    imports   : [
        CommonModule, FormsModule, ReactiveFormsModule,
        MatButtonModule, MatDialogModule, MatFormFieldModule,
        MatInputModule, MatProgressSpinnerModule, MatSelectModule,
    ],
    template: `
        <h2 mat-dialog-title>Record Payment</h2>
        <mat-dialog-content>
            <form [formGroup]="form" class="flex flex-col gap-4 pt-2">
                <mat-form-field>
                    <mat-label>Debt</mat-label>
                    <mat-select formControlName="debt">
                        <mat-option *ngFor="let d of debts" [value]="d.id">
                            {{ d.customer_name }} — {{ d.remaining_amount | number:'1.0-0' }} remaining
                        </mat-option>
                    </mat-select>
                    <mat-error *ngIf="form.get('debt').hasError('required')">Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Amount</mat-label>
                    <input matInput type="number" formControlName="amount">
                    <mat-error *ngIf="form.get('amount').hasError('required')">Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Note</mat-label>
                    <input matInput formControlName="note">
                </mat-form-field>
            </form>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button mat-dialog-close>Cancel</button>
            <button mat-flat-button color="primary" [disabled]="form.invalid || saving" (click)="save()">
                <mat-progress-spinner *ngIf="saving" [diameter]="18" mode="indeterminate"></mat-progress-spinner>
                <span *ngIf="!saving">Save</span>
            </button>
        </mat-dialog-actions>
    `,
})
export class PaymentFormDialogComponent implements OnInit
{
    form: UntypedFormGroup;
    saving = false;
    debts: any[] = [];

    constructor(
        private _fb: UntypedFormBuilder,
        private _service: PaymentsService,
        private _dialogRef: MatDialogRef<PaymentFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit(): void
    {
        this.form = this._fb.group({
            debt  : [null, Validators.required],
            amount: [null, [Validators.required, Validators.min(0.01)]],
            note  : [''],
        });

        this._service.getDebts().subscribe(res =>
        {
            this.debts = res.results ?? res;
        });
    }

    save(): void
    {
        if (this.form.invalid) { return; }
        this.saving = true;
        this._service.create(this.form.value).subscribe({
            next : () => { this.saving = false; this._dialogRef.close(true); },
            error: () => { this.saving = false; },
        });
    }
}
