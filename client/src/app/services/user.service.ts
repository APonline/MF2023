import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/users.model';
import { environment } from 'src/environments/environment';

const baseUrl = environment.apiUrl + 'users';
const signup = environment.apiUrl + 'auth/signup';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<any> {
    return this.http.get<User[]>(baseUrl);
  }

  get(id: any): Observable<User> {
    return this.http.get(`${baseUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post(signup, data);
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

  findByUsername(username: any): Observable<User[]> {
    return this.http.get<User[]>(`${baseUrl}?username=${username}`);
  }

  findByEmail(email: any): Observable<User[]> {
    return this.http.get<User[]>(`${baseUrl}?email=${email}`);
  }

  verify(data: any): Observable<any> {
    return this.http.post(`${baseUrl}/verify`, data);
  }

  passwordReset(data: any): Observable<any> {
    return this.http.post(`${baseUrl}/passwordReset`, data);
  }

}
