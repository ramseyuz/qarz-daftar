import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomersService
{
    private _api = environment.apiUrl;

    constructor(private _http: HttpClient) {}

    getAll(params?: { search?: string; page?: number }): Observable<any>
    {
        let httpParams = new HttpParams();
        if (params?.search) { httpParams = httpParams.set('search', params.search); }
        if (params?.page)   { httpParams = httpParams.set('page', params.page.toString()); }
        return this._http.get(`${this._api}/customers/`, { params: httpParams });
    }

    getById(id: string): Observable<any>
    {
        return this._http.get(`${this._api}/customers/${id}/`);
    }

    create(data: any): Observable<any>
    {
        return this._http.post(`${this._api}/customers/`, data);
    }

    update(id: string, data: any): Observable<any>
    {
        return this._http.patch(`${this._api}/customers/${id}/`, data);
    }

    delete(id: string): Observable<any>
    {
        return this._http.delete(`${this._api}/customers/${id}/`);
    }
}
