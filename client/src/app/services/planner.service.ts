import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const baseUrl = environment.apiUrl + 'planner';

@Injectable({
    providedIn: 'root'
})
export class PlannerService {

    constructor(private http: HttpClient) { }

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(baseUrl);
    }

    getAllForArtist(id: number): Observable<any[]> {
        return this.http.get<any[]>(`${baseUrl}/artist/${id}`);
    }

    get(id: number): Observable<any> {
        return this.http.get<any>(`${baseUrl}/${id}`);
    }

    create(data: any): Observable<any> {
        return this.http.post<any>(baseUrl, data);
    }

    update(id: number, data: any): Observable<any> {
        return this.http.put<any>(`${baseUrl}/${id}`, data);
    }

    delete(id: number): Observable<any> {
        return this.http.delete<any>(`${baseUrl}/${id}`);
    }

    deleteAll(): Observable<any> {
        return this.http.delete<any>(baseUrl);
    }

    /**
     * Optional: fetch events for a date range (for week/month views)
     * /api/v1/planner/range?start=ISO&end=ISO&owner_group=ID
     */
    getRange(start: string, end: string, ownerGroupId: number): Observable<any[]> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('owner_group', ownerGroupId.toString());

        return this.http.get<any[]>(`${baseUrl}/range`, { params });
    }
}
