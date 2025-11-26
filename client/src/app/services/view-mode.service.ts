// src/app/services/view-mode.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ViewMode = 'View' | 'List';

@Injectable({ providedIn: 'root' })
export class ViewModeService {
    private _mode = new BehaviorSubject<ViewMode>('List');
    readonly mode$ = this._mode.asObservable();

    get value(): ViewMode {
        return this._mode.value;
    }

    set(mode: ViewMode) {
        this._mode.next(mode);
    }

    toggle() {
        this._mode.next(this._mode.value === 'View' ? 'List' : 'View');
    }
}
