import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersManagementService
{
    private _api = environment.apiUrl;

    constructor(private _http: HttpClient) {}

    getAll(params?: { search?: string; page?: number }): Observable<any>
    {
        let p = new HttpParams();
        if (params?.search) { p = p.set('search', params.search); }
        if (params?.page)   { p = p.set('page', String(params.page)); }
        return this._http.get(`${this._api}/users/`, { params: p });
    }

    getById(id: string): Observable<any>
    {
        return this._http.get(`${this._api}/users/${id}/`);
    }

    create(data: any): Observable<any>
    {
        return this._http.post(`${this._api}/users/`, data);
    }

    update(id: string, data: any): Observable<any>
    {
        return this._http.patch(`${this._api}/users/${id}/`, data);
    }

    deactivate(id: string): Observable<any>
    {
        return this._http.delete(`${this._api}/users/${id}/`);
    }

    getBusinesses(): Observable<any>
    {
        return this._http.get(`${this._api}/businesses/?page_size=200`);
    }
}
