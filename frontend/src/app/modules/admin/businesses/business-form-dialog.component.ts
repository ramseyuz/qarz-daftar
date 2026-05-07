import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BusinessesService } from './businesses.service';

@Component({
    selector  : 'app-business-form-dialog',
    standalone: true,
    imports   : [
        CommonModule, FormsModule, ReactiveFormsModule,
        MatButtonModule, MatDialogModule, MatFormFieldModule,
        MatIconModule, MatInputModule, MatProgressSpinnerModule,
    ],
    template: `
        <h2 mat-dialog-title>{{ isEdit ? 'Edit Business' : 'New Business' }}</h2>
        <mat-dialog-content>
            <form [formGroup]="form" class="flex flex-col gap-4 pt-2">
                <mat-form-field>
                    <mat-label>Business Name</mat-label>
                    <input matInput formControlName="name">
                    <mat-error *ngIf="form.get('name').hasError('required')">Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Phone (e.g. +998901234567)</mat-label>
                    <input matInput formControlName="phone">
                    <mat-error *ngIf="form.get('phone').hasError('required')">Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Address</mat-label>
                    <textarea matInput formControlName="address" rows="2"></textarea>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Description</mat-label>
                    <textarea matInput formControlName="description" rows="2"></textarea>
                </mat-form-field>
                <mat-form-field *ngIf="isSuperAdmin">
                    <mat-label>Max Employees</mat-label>
                    <input matInput formControlName="max_users" type="number" min="1">
                    <mat-hint>Maximum number of employees this business can have</mat-hint>
                </mat-form-field>
            </form>
            <p *ngIf="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
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
export class BusinessFormDialogComponent implements OnInit
{
    form: UntypedFormGroup;
    saving       = false;
    isEdit       = false;
    isSuperAdmin = false;
    error        = '';

    constructor(
        private _fb: UntypedFormBuilder,
        private _service: BusinessesService,
        private _dialogRef: MatDialogRef<BusinessFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit(): void
    {
        this.isSuperAdmin = !!this.data?._isSuperAdmin;
        this.isEdit       = !!this.data?.id;

        this.form = this._fb.group({
            name       : [this.data?.name        ?? '', Validators.required],
            phone      : [this.data?.phone        ?? '', Validators.required],
            address    : [this.data?.address      ?? ''],
            description: [this.data?.description  ?? ''],
            ...(this.isSuperAdmin ? { max_users: [this.data?.max_users ?? 10, [Validators.required, Validators.min(1)]] } : {}),
        });
    }

    save(): void
    {
        if (this.form.invalid) { return; }
        this.saving = true;
        this.error  = '';

        const payload = { ...this.form.value };
        delete payload._isSuperAdmin;

        const req = this.isEdit
            ? this._service.update(this.data.id, payload)
            : this._service.create(payload);

        req.subscribe({
            next : () => { this.saving = false; this._dialogRef.close(true); },
            error: (err) =>
            {
                this.saving = false;
                this.error  = err?.error?.phone?.[0] ?? err?.error?.detail ?? 'An error occurred.';
            },
        });
    }
}
