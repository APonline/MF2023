import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

const baseUrl = environment.apiUrl + `artist-activitys`;
const signup = environment.apiUrl + 'auth/signup';

@Injectable({
  providedIn: 'root'
})
export class ArtistActivityService {

  constructor(private http: HttpClient) { }

  private refresh$ = new Subject<void>();
  refreshChanges$ = this.refresh$.asObservable();   // the feed will listen to this

  kickRefresh() { this.refresh$.next(); }  
  

  getAll(id: any): Observable<any> {
    return this.http.get<any[]>(`${baseUrl}/artist/${id}`);
  }

  get(id: any): Observable<any> {
    return this.http.get<any[]>(`${baseUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post(baseUrl, data);
  }

  update(id: any, data: any): Observable<any> {
    return this.http.put(`${baseUrl}/${id}`, data);
  }

  delete(id: any): Observable<any> {
    return this.http.delete(`${baseUrl}/${id}`);
  }

  deleteAll(): Observable<any> {
    return this.http.delete(baseUrl);
  }

  // findByUsername(username: any): Observable<User[]> {
  //   return this.http.get<User[]>(`${baseUrl}?username=${username}`);
  // }

}
