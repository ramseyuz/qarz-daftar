import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { UsersManagementService } from './users.service';

@Component({
    selector  : 'app-user-form-dialog',
    standalone: true,
    imports   : [
        CommonModule, FormsModule, ReactiveFormsModule,
        MatButtonModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule,
        MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule,
    ],
    template: `
        <h2 mat-dialog-title>{{ isEdit ? 'Edit User' : 'New User' }}</h2>
        <mat-dialog-content style="min-width:480px">
            <form [formGroup]="form" class="flex flex-col gap-4 pt-2">
                <div class="grid grid-cols-2 gap-4">
                    <mat-form-field>
                        <mat-label>First Name</mat-label>
                        <input matInput formControlName="first_name">
                    </mat-form-field>
                    <mat-form-field>
                        <mat-label>Last Name</mat-label>
                        <input matInput formControlName="last_name">
                    </mat-form-field>
                </div>
                <mat-form-field>
                    <mat-label>Email</mat-label>
                    <input matInput formControlName="email" type="email">
                    <mat-error *ngIf="form.get('email').hasError('required')">Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Username</mat-label>
                    <input matInput formControlName="username">
                    <mat-error *ngIf="form.get('username').hasError('required')">Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Phone</mat-label>
                    <input matInput formControlName="phone" placeholder="+998901234567">
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Role</mat-label>
                    <mat-select formControlName="role">
                        <mat-option value="superadmin">Super Admin</mat-option>
                        <mat-option value="owner">Owner</mat-option>
                        <mat-option value="employee">Employee</mat-option>
                    </mat-select>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Business</mat-label>
                    <mat-select formControlName="business">
                        <mat-option [value]="null">— No business —</mat-option>
                        <mat-option *ngFor="let b of businesses" [value]="b.id">{{ b.name }}</mat-option>
                    </mat-select>
                </mat-form-field>
                <mat-form-field *ngIf="!isEdit">
                    <mat-label>Password</mat-label>
                    <input matInput formControlName="password" type="password">
                    <mat-error *ngIf="form.get('password').hasError('required')">Required</mat-error>
                </mat-form-field>
                <mat-form-field *ngIf="isEdit">
                    <mat-label>New Password (leave blank to keep current)</mat-label>
                    <input matInput formControlName="new_password" type="password">
                </mat-form-field>
                <div class="flex gap-4">
                    <mat-checkbox formControlName="is_active">Active</mat-checkbox>
                    <mat-checkbox formControlName="is_superuser">Django Superuser</mat-checkbox>
                </div>
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
export class UserFormDialogComponent implements OnInit
{
    form: UntypedFormGroup;
    saving    = false;
    isEdit    = false;
    error     = '';
    businesses: any[] = [];

    constructor(
        private _fb: UntypedFormBuilder,
        private _service: UsersManagementService,
        private _dialogRef: MatDialogRef<UserFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit(): void
    {
        this.isEdit = !!this.data;
        this.form = this._fb.group({
            first_name  : [this.data?.first_name   ?? ''],
            last_name   : [this.data?.last_name    ?? ''],
            email       : [this.data?.email        ?? '', [Validators.required, Validators.email]],
            username    : [this.data?.username     ?? '', Validators.required],
            phone       : [this.data?.phone        ?? ''],
            role        : [this.data?.role         ?? 'owner'],
            business    : [this.data?.business     ?? null],
            is_active   : [this.data?.is_active    ?? true],
            is_superuser: [this.data?.is_superuser ?? false],
            ...(!this.isEdit ? { password: ['', Validators.required] } : { new_password: [''] }),
        });

        this._service.getBusinesses().subscribe({
            next: (res) => { this.businesses = res.results ?? res; },
        });
    }

    save(): void
    {
        if (this.form.invalid) { return; }
        this.saving = true;
        this.error  = '';

        const payload = { ...this.form.value };
        if (payload.business === null) { payload.business = null; }
        if (this.isEdit && !payload.new_password) { delete payload.new_password; }

        const req = this.isEdit
            ? this._service.update(this.data.id, payload)
            : this._service.create(payload);

        req.subscribe({
            next : () => { this.saving = false; this._dialogRef.close(true); },
            error: (err) =>
            {
                this.saving = false;
                const e = err?.error;
                this.error = e?.email?.[0] ?? e?.username?.[0] ?? e?.password?.[0] ?? e?.detail ?? 'An error occurred.';
            },
        });
    }
}
