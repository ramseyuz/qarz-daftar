import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class BusinessesService
{
    private _api = environment.apiUrl;

    constructor(private _http: HttpClient) {}

    getAll(params?: { search?: string; page?: number }): Observable<any>
    {
        let p = new HttpParams();
        if (params?.search) { p = p.set('search', params.search); }
        if (params?.page)   { p = p.set('page', String(params.page)); }
        return this._http.get(`${this._api}/businesses/`, { params: p });
    }

    getById(id: string): Observable<any>
    {
        return this._http.get(`${this._api}/businesses/${id}/`);
    }

    create(data: any): Observable<any>
    {
        return this._http.post(`${this._api}/businesses/`, data);
    }

    update(id: string, data: any): Observable<any>
    {
        return this._http.patch(`${this._api}/businesses/${id}/`, data);
    }

    delete(id: string): Observable<any>
    {
        return this._http.delete(`${this._api}/businesses/${id}/`);
    }
}
