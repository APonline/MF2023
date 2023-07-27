import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../services/authentication.service';
import { user } from 'src/app/models/users.model';

@Component({
  selector: 'app-mainNav',
  templateUrl: './mainNav.component.html',
  styleUrls: ['./mainNav.component.scss']
 })
export class MainNavComponent implements OnInit {
    currentUser: any;
    toggle:boolean = true;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService
    ) {

        // redirect to home if already logged in
        if (this.authenticationService.currentUserValue) {
          this.currentUser = this.authenticationService.currentUserValue;
        }else{
          this.currentUser = false;
        }
    }

    ngOnInit() {
    }

    change(){
      this.toggle = !this.toggle;
    }

    logout() {
      this.currentUser = undefined;
      this.toggle = false;
      this.authenticationService.logout();
    }
}
