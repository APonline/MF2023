import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

import { AlertService } from '../../services/alert.service';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-register',
  templateUrl: 'register.component.html',
  styleUrls: ['register.component.scss']
})
export class RegisterComponent implements OnInit {

  registerForm: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService,
    private userService: UserService,
    private alertService: AlertService,
    @Inject(DOCUMENT) private _document: Document
  ) {
    // redirect to home if already logged in
    if (this.authenticationService.currentUserValue) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', Validators.required],
      phone: [''],
      city: [''],
      country: [''],
      //birthday: [''],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.registerForm.controls; }

  async onSubmit() {
    this.submitted = true;

    // reset alerts on submit
    this.alertService.clear();

    // stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.userService.register(this.registerForm.value)
      .then(
        data => {
          if (!data.hasOwnProperty('error')) {
            this.alertService.success('Registration successful.', true);
            this.loading = true;
            this.authenticationService.login(data.email, this.registerForm.value.password)
              .then(
                data => {
                  this._document.defaultView.location.reload();
                },
                error => {
                  this.alertService.error(error);
                  this.loading = false;
                });
          } else {
            this.alertService.error('That Username & Email already exists.', true);
            this.loading = false;
          }
        },
        error => {
          this.alertService.error(error);
          this.loading = false;
        }
      );
  }

  registerUser() {
    this.onSubmit();
  }

  cancel() {
    this.router.navigate(['/login']);
  }
}
