import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../services/authentication.service';
import { User } from 'src/app/models/users.model';

@Component({
  selector: 'app-mainNav',
  templateUrl: './mainNav.component.html',
  styleUrls: ['./mainNav.component.scss']
 })
export class MainNavComponent implements OnInit {
    currentUser: User;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService
    ) {

        // redirect to home if already logged in
        if (this.authenticationService.currentUserValue) {
          this.currentUser = this.authenticationService.currentUserValue;
        }
    }

    ngOnInit() {

    }

    logout() {
      this.currentUser = undefined;
      this.authenticationService.logout();
    }
}
