import { DOCUMENT } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User } from '../types/user';
import { Query } from '../types/query'

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;
  use = '';

  constructor(private apollo: Apollo, @Inject(DOCUMENT) private _document: Document) {
    this.use = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(this.use));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  login(email, password) {
    const variables = {
      email,
      password
    };

    return this.apollo.query<Query>({
      query: gql`
          query Login($email: String, $password: String) {
            Login(email: $email, password: $password) {
              id
              name
              username
              firstname
              lastname
              password
              email
              dateCreated {
                formatted
              }
              active
            }
          }
        `,
      variables
    }).pipe(
      map(result => {
        const user = result.data.Login;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
      })
    ).toPromise();
  }

  logout() {
    // remove user from local storage and set current user to null
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this._document.defaultView.location.reload();
  }
}
