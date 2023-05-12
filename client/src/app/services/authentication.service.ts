import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { UserService } from './user.service';
import { HttpClient } from '@angular/common/http';
import { user } from '../models/users.model';
import { environment } from 'src/environments/environment';

const baseUrl = environment.apiUrl + 'auth';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<user>;
  public currentUser: Observable<user>;
  use = '';

  constructor(private http: HttpClient, @Inject(DOCUMENT) private _document: Document, private user: UserService) {
    this.use = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<user>(JSON.parse(this.use));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): user {
    return this.currentUserSubject.value;
  }

  login(email: any, password: any): Observable<any> {
    let data = {
      email,
      password
    }

    const res = this.http.post(`${baseUrl}/signin`, data);
    res.subscribe((result) => {
      const user = result;
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
    });

    return res;


    //return this.http.post(`${baseUrl}/signin`, data);
  }

  logout() {
    // remove user from local storage and set current user to null
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this._document.defaultView.location.reload();
  }
}
