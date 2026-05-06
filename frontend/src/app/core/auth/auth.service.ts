import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserService } from 'app/core/user/user.service';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({providedIn: 'root'})
export class AuthService
{
    private _authenticated: boolean = false;
    private _apiUrl = environment.apiUrl;

    constructor(
        private _httpClient: HttpClient,
        private _userService: UserService,
    ) {}

    set accessToken(token: string)
    {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    }

    set refreshToken(token: string)
    {
        localStorage.setItem('refreshToken', token);
    }

    get refreshToken(): string
    {
        return localStorage.getItem('refreshToken') ?? '';
    }

    get isSuperAdmin(): boolean
    {
        try {
            const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
            return payload?.role === 'superadmin';
        } catch { return false; }
    }

    forgotPassword(email: string): Observable<any>
    {
        return this._httpClient.post(`${this._apiUrl}/auth/forgot-password/`, {email});
    }

    resetPassword(password: string): Observable<any>
    {
        return this._httpClient.post(`${this._apiUrl}/auth/reset-password/`, {password});
    }

    signIn(credentials: { username: string; password: string }): Observable<any>
    {
        if ( this._authenticated )
        {
            return throwError('User is already logged in.');
        }

        return this._httpClient.post(`${this._apiUrl}/auth/login/`, credentials).pipe(
            switchMap((response: any) =>
            {
                this.accessToken = response.access;
                this.refreshToken = response.refresh;
                this._authenticated = true;

                const user = response.user;
                this._userService.user = {
                    id    : user.id,
                    name  : user.full_name,
                    email : user.email,
                    role  : user.role,
                    status: 'online',
                };

                return of(response);
            }),
        );
    }

    signInUsingToken(): Observable<any>
    {
        if ( !this.accessToken )
        {
            return of(false);
        }

        return this._httpClient.get(`${this._apiUrl}/auth/profile/`).pipe(
            catchError(() =>
            {
                if ( !this.refreshToken )
                {
                    return of(false);
                }
                return this._httpClient.post(`${this._apiUrl}/auth/token/refresh/`, {
                    refresh: this.refreshToken,
                }).pipe(
                    switchMap((res: any) =>
                    {
                        this.accessToken = res.access;
                        return this._httpClient.get(`${this._apiUrl}/auth/profile/`);
                    }),
                    catchError(() => of(false)),
                );
            }),
            switchMap((response: any) =>
            {
                if ( response === false )
                {
                    return of(false);
                }

                this._authenticated = true;
                this._userService.user = {
                    id    : response.id,
                    name  : `${response.first_name} ${response.last_name}`.trim() || response.email,
                    email : response.email,
                    role  : response.role,
                    avatar: response.avatar ?? null,
                    status: 'online',
                };

                return of(true);
            }),
        );
    }

    signOut(): Observable<any>
    {
        if ( this.refreshToken )
        {
            this._httpClient.post(`${this._apiUrl}/auth/logout/`, {
                refresh: this.refreshToken,
            }).subscribe();
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this._authenticated = false;

        return of(true);
    }

    signUp(user: {
        first_name: string;
        last_name: string;
        email: string;
        username: string;
        password: string;
        password2: string;
    }): Observable<any>
    {
        return this._httpClient.post(`${this._apiUrl}/auth/register/`, user);
    }

    unlockSession(credentials: { username: string; password: string }): Observable<any>
    {
        return this.signIn(credentials);
    }

    check(): Observable<boolean>
    {
        if ( this._authenticated )
        {
            return of(true);
        }

        if ( !this.accessToken )
        {
            return of(false);
        }

        return this.signInUsingToken();
    }
}
