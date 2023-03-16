import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { UserService } from './user.service';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/users.model';
import { environment } from 'src/environments/environment';

const baseUrl = environment.apiUrl + 'auth';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;
  use = '';

  constructor(private http: HttpClient, @Inject(DOCUMENT) private _document: Document, private user: UserService) {
    this.use = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(this.use));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  login(email: any, password: any): Observable<User[]> {
    return this.http.get<User[]>(`${baseUrl}/signin?email=${email}&password=${password}`);
  }

  logout() {
    // remove user from local storage and set current user to null
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this._document.defaultView.location.reload();
  }
}
