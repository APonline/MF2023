import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/users.model';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss']
})
export class HomeContainer implements OnInit {
  currentUser: User;
  userList: any[];

  constructor(
    private authenticationService: AuthenticationService,
    private user: UserService
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
  }

  async ngOnInit() {
    this.user.getAll().subscribe(user => {
      this.userList = user;
    });
  }
}
