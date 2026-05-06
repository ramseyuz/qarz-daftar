import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductsService } from './products.service';

@Component({
    selector  : 'app-product-form-dialog',
    standalone: true,
    imports   : [
        CommonModule, FormsModule, ReactiveFormsModule,
        MatButtonModule, MatDialogModule, MatFormFieldModule,
        MatInputModule, MatProgressSpinnerModule,
    ],
    template: `
        <h2 mat-dialog-title>{{ isEdit ? 'Edit Product' : 'New Product' }}</h2>
        <mat-dialog-content>
            <form [formGroup]="form" class="flex flex-col gap-4 pt-2">
                <mat-form-field>
                    <mat-label>Product Name</mat-label>
                    <input matInput formControlName="name">
                    <mat-error *ngIf="form.get('name').hasError('required')">Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Unit (e.g. kg, pcs)</mat-label>
                    <input matInput formControlName="unit">
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Price</mat-label>
                    <input matInput type="number" formControlName="price">
                    <mat-error *ngIf="form.get('price').hasError('required')">Required</mat-error>
                </mat-form-field>
                <mat-form-field>
                    <mat-label>Description</mat-label>
                    <textarea matInput formControlName="description" rows="2"></textarea>
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
export class ProductFormDialogComponent implements OnInit
{
    form: UntypedFormGroup;
    saving = false;
    isEdit = false;

    constructor(
        private _fb: UntypedFormBuilder,
        private _service: ProductsService,
        private _dialogRef: MatDialogRef<ProductFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit(): void
    {
        this.isEdit = !!this.data;
        this.form = this._fb.group({
            name       : [this.data?.name        ?? '', Validators.required],
            unit       : [this.data?.unit        ?? ''],
            price      : [this.data?.price       ?? null, Validators.required],
            description: [this.data?.description ?? ''],
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
