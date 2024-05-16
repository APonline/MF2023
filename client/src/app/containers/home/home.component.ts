import { Component, OnInit } from '@angular/core';
import { user } from 'src/app/models/users.model';
import { AuthenticationService } from '../../services/authentication.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss']
})
export class HomeContainer implements OnInit {

  currentUser: user;

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
  ) {
    this.currentUser = this.authenticationService.currentUserValue;

    this.router.navigate(['/projects']);
  }

  async ngOnInit() {

  }

  ngOnDestroy() {
  }
}
