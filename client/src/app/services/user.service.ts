import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { user } from '../models/users.model';
import { environment } from 'src/environments/environment';

const baseUrl = environment.apiUrl + 'users';
const signup = environment.apiUrl + 'auth/signup';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<any> {
    return this.http.get<user[]>(baseUrl);
  }

  get(id: any): Observable<user> {
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

  findByUsername(username: any): Observable<user[]> {
    return this.http.get<user[]>(`${baseUrl}?username=${username}`);
  }

  findUsers(username: any): Observable<user[]> {
    return this.http.get<user[]>(`${baseUrl}/find/${username}`);
  }

  findByEmail(email: any): Observable<user[]> {
    return this.http.get<user[]>(`${baseUrl}?email=${email}`);
  }

  verify(data: any): Observable<any> {
    return this.http.put(`${baseUrl}/verify/${data}`, data);
  }

  tna(data: any): Observable<any> {
    return this.http.put(`${baseUrl}/tna/${data}`, data);
  }

  passwordReset(data: any): Observable<any> {
    return this.http.post(`${baseUrl}/passwordReset`, data);
  }

  getChatHistoryWith(group, user, chatee): Observable<any> {
    return this.http.get(`${baseUrl}/chatHistoryWith/${group}/${user}/${chatee}`);
  }

  updateChatHistoryWith(group, user, chatee, data): Observable<any> {
    return this.http.put(`${baseUrl}/chatHistoryWith/${group}/${user}/${chatee}`, data);
  }

}
