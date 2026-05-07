import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SubscriptionsService
{
    private _base = '/api/v1/subscriptions/';

    constructor(private _http: HttpClient) {}

    getAll(params?: any): Observable<any>           { return this._http.get(this._base, { params }); }
    create(data: any): Observable<any>              { return this._http.post(this._base, data); }
    update(id: string, data: any): Observable<any>  { return this._http.patch(`${this._base}${id}/`, data); }
    delete(id: string): Observable<any>             { return this._http.delete(`${this._base}${id}/`); }
    getPlans(): Observable<any>                     { return this._http.get('/api/v1/subscription-plans/'); }
    getBusinesses(): Observable<any>                { return this._http.get('/api/v1/businesses/'); }
}
