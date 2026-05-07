import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

export interface SubscriptionStatus {
    valid: boolean;
    endDate: string | null;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService
{
    private _status$ = new BehaviorSubject<SubscriptionStatus>({ valid: true, endDate: null });

    get status$(): Observable<SubscriptionStatus> { return this._status$.asObservable(); }
    get isValid$(): Observable<boolean>            { return this._status$.pipe(map(s => s.valid)); }
    get isValid(): boolean                         { return this._status$.value.valid; }
    get endDate(): string | null                   { return this._status$.value.endDate; }

    setStatus(valid: boolean, endDate: string | null): void
    {
        this._status$.next({ valid, endDate });
    }
}
