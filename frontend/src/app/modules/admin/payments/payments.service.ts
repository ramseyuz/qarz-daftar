import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentsService
{
    private _api = environment.apiUrl;

    constructor(private _http: HttpClient) {}

    getAll(params?: { page?: number }): Observable<any>
    {
        let httpParams = new HttpParams();
        if (params?.page) { httpParams = httpParams.set('page', params.page.toString()); }
        return this._http.get(`${this._api}/payments/`, { params: httpParams });
    }

    create(data: any): Observable<any>
    {
        return this._http.post(`${this._api}/payments/`, data);
    }

    delete(id: string): Observable<any>
    {
        return this._http.delete(`${this._api}/payments/${id}/`);
    }

    getDebts(): Observable<any>
    {
        return this._http.get(`${this._api}/debts/?exclude_status=paid&page_size=200`);
    }
}
