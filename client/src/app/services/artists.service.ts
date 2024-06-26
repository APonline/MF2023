import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const baseUrl = environment.apiUrl + `artists`;
const signup = environment.apiUrl + 'auth/signup';



@Injectable({
  providedIn: 'root'
})
export class ArtistsService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<any> {
    return this.http.get<any[]>(baseUrl);
  }

  get(id: any): Observable<any> {
    return this.http.get(`${baseUrl}/${id}`);
  }

  find(name: any): Observable<any> {
    return this.http.get(`${baseUrl}/project/${name}`);
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
