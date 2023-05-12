import { Component, OnInit } from '@angular/core';
import { user } from 'src/app/models/users.model';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: 'signup.component.html',
  styleUrls: ['signup.component.scss']
})
export class SignupContainer implements OnInit {
  currentUser: user;
  userList: any[];

  constructor() {}

  ngOnInit() {
  }

}
