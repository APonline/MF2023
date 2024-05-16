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
      this.router.navigate(['/projects']);
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

    this.userService.create(this.registerForm.value)
      .subscribe({
        next: (res) => {
          this.alertService.success('Registration successful.', true);
          this.loading = true;
          this.submitted = true;

          this.authenticationService.login(this.f.email.value, this.f.password.value).subscribe({
            next: (res) => {
              this._document.defaultView.location.reload();
            },
            error: (e) => {
              this.alertService.error(e.message);
              this.loading = false;
            }
          });
        },
        error: (e) => {
          this.alertService.error('That Username & Email already exists.', true);
          this.loading = false;
        }
      });
  }

  registerUser() {
    this.onSubmit();
  }

  cancel() {
    this.router.navigate(['/login']);
  }
}
