import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, Subject } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';
import { UsersManagementService } from './users.service';
import { UserFormDialogComponent } from './user-form-dialog.component';

@Component({
    selector  : 'app-users-list',
    standalone: true,
    imports   : [
        CommonModule, FormsModule,
        MatButtonModule, MatChipsModule, MatDialogModule, MatFormFieldModule,
        MatIconModule, MatInputModule, MatProgressSpinnerModule,
        MatTableModule, MatTooltipModule,
    ],
    templateUrl: './users-list.component.html',
})
export class UsersListComponent implements OnInit
{
    users: any[]     = [];
    loading          = true;
    searchValue      = '';
    isSuperAdmin     = false;
    isOwner          = false;
    maxUsers         = 0;
    userCount        = 0;

    private _search$ = new Subject<string>();

    get canCreateUser(): boolean { return this.isSuperAdmin || (this.isOwner && this.userCount < this.maxUsers); }
    get displayedColumns(): string[]
    {
        return this.isSuperAdmin
            ? ['name', 'email', 'role', 'business', 'is_active', 'joined', 'actions']
            : ['name', 'email', 'phone', 'is_active', 'joined', 'actions'];
    }

    constructor(
        private _service: UsersManagementService,
        private _dialog : MatDialog,
        private _auth   : AuthService,
    ) {}

    ngOnInit(): void
    {
        this.isSuperAdmin = this._auth.isSuperAdmin;
        this.isOwner      = this._auth.isOwner;
        this._load();
        this._search$.pipe(debounceTime(300)).subscribe(() => this._load());

        if (this.isOwner)
        {
            this._service.getBusinesses().subscribe({
                next: (res) =>
                {
                    const biz = (res.results ?? res)[0];
                    if (biz) { this.maxUsers = biz.max_users ?? 10; this.userCount = biz.user_count ?? 0; }
                },
            });
        }
    }

    private _load(): void
    {
        this.loading = true;
        this._service.getAll({ search: this.searchValue }).subscribe({
            next : (res) =>
            {
                this.users     = res.results ?? res;
                this.userCount = this.users.filter(u => u.is_active).length;
                this.loading   = false;
            },
            error: () => { this.loading = false; },
        });
    }

    onSearch(v: string): void { this.searchValue = v; this._search$.next(v); }

    openCreate(): void
    {
        this._dialog.open(UserFormDialogComponent, {
            width: '560px',
            data : { _ownerContext: this.isOwner },
        }).afterClosed().subscribe(ok => { if (ok) { this._load(); } });
    }

    openEdit(u: any): void
    {
        this._dialog.open(UserFormDialogComponent, {
            width: '560px',
            data : { ...u, _ownerContext: this.isOwner },
        }).afterClosed().subscribe(ok => { if (ok) { this._load(); } });
    }

    deactivate(u: any): void
    {
        const action = u.is_active ? 'deactivate' : 'delete record for';
        if (!confirm(`${action} "${u.email}"?`)) { return; }
        this._service.deactivate(u.id).subscribe({
            next : () => this._load(),
            error: (err) => alert(err?.error?.detail ?? 'Failed.'),
        });
    }

    roleClass(role: string): string
    {
        return {
            superadmin: 'bg-purple-100 text-purple-700',
            owner     : 'bg-blue-100 text-blue-700',
            employee  : 'bg-gray-100 text-gray-700',
        }[role] ?? 'bg-gray-100 text-gray-600';
    }
}
