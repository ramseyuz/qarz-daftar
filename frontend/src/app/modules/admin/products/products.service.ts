import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductsService
{
    private _api = environment.apiUrl;

    constructor(private _http: HttpClient) {}

    getAll(params?: { search?: string }): Observable<any>
    {
        let httpParams = new HttpParams();
        if (params?.search) { httpParams = httpParams.set('search', params.search); }
        return this._http.get(`${this._api}/products/`, { params: httpParams });
    }

    create(data: any): Observable<any>
    {
        return this._http.post(`${this._api}/products/`, data);
    }

    update(id: string, data: any): Observable<any>
    {
        return this._http.patch(`${this._api}/products/${id}/`, data);
    }

    delete(id: string): Observable<any>
    {
        return this._http.delete(`${this._api}/products/${id}/`);
    }
}
