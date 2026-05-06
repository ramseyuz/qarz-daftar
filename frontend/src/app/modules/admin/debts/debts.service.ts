import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class DebtsService
{
    private _api = environment.apiUrl;

    constructor(private _http: HttpClient) {}

    getAll(params?: { search?: string; status?: string; page?: number }): Observable<any>
    {
        let httpParams = new HttpParams();
        if (params?.search) { httpParams = httpParams.set('search', params.search); }
        if (params?.status) { httpParams = httpParams.set('status', params.status); }
        if (params?.page)   { httpParams = httpParams.set('page', params.page.toString()); }
        return this._http.get(`${this._api}/debts/`, { params: httpParams });
    }

    getById(id: string): Observable<any>
    {
        return this._http.get(`${this._api}/debts/${id}/`);
    }

    create(data: any): Observable<any>
    {
        return this._http.post(`${this._api}/debts/`, data);
    }

    update(id: string, data: any): Observable<any>
    {
        return this._http.patch(`${this._api}/debts/${id}/`, data);
    }

    delete(id: string): Observable<any>
    {
        return this._http.delete(`${this._api}/debts/${id}/`);
    }

    getCustomers(): Observable<any>
    {
        return this._http.get(`${this._api}/customers/?page_size=200`);
    }

    exportExcel(): void
    {
        const token = localStorage.getItem('accessToken') ?? '';
        fetch(`${this._api}/debts/export/excel/`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then(r => r.blob())
        .then(blob =>
        {
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href    = url;
            a.download = `debts_${new Date().toISOString().slice(0,10)}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
}
