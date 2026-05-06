import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomersService } from './customers.service';

@Component({
    selector  : 'app-customer-form-dialog',
    standalone: true,
    imports   : [
        CommonModule, FormsModule, ReactiveFormsModule,
        MatButtonModule, MatDialogModule, MatFormFieldModule,
        MatIconModule, MatInputModule, MatProgressSpinnerModule,
    ],
    template: `
        <h2 mat-dialog-title>{{ isEdit ? 'Edit Customer' : 'New Customer' }}</h2>
        <mat-dialog-content>
            <form [formGroup]="form" class="flex flex-col gap-4 pt-2">
                <mat-form-field>
                    <mat-label>Full Name</mat-label>
                    <input matInput formControlName="full_name">
                    <mat-error *ngIf="form.get('full_name').hasError('required')">Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Phone (e.g. +998901234567)</mat-label>
                    <input matInput formControlName="phone">
                    <mat-error *ngIf="form.get('phone').hasError('required')">Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Address</mat-label>
                    <input matInput formControlName="address">
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Notes</mat-label>
                    <textarea matInput formControlName="notes" rows="2"></textarea>
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
export class CustomerFormDialogComponent implements OnInit
{
    form: UntypedFormGroup;
    saving = false;
    isEdit = false;

    constructor(
        private _fb: UntypedFormBuilder,
        private _service: CustomersService,
        private _dialogRef: MatDialogRef<CustomerFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit(): void
    {
        this.isEdit = !!this.data;
        this.form = this._fb.group({
            full_name: [this.data?.full_name ?? '', Validators.required],
            phone    : [this.data?.phone     ?? '', Validators.required],
            address  : [this.data?.address   ?? ''],
            notes    : [this.data?.notes     ?? ''],
        });
    }

    save(): void
    {
        if (this.form.invalid) { return; }
        this.saving = true;
        const req = this.isEdit
            ? this._service.update(this.data.id, this.form.value)
            : this._service.create(this.form.value);

        req.subscribe({
            next : () => { this.saving = false; this._dialogRef.close(true); },
            error: () => { this.saving = false; },
        });
    }
}
