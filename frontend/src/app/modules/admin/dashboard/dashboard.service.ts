import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService
{
    private _api = environment.apiUrl;

    constructor(private _http: HttpClient) {}

    getDebtReport(): Observable<any>
    {
        return this._http.get(`${this._api}/reports/debts/`);
    }
}
