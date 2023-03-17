import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-passwordReset',
  templateUrl: 'passwordReset.component.html',
  styleUrls: ['passwordReset.component.scss']
})
export class PasswordResetComponent implements OnInit {
  resetPassForm: FormGroup;
  currentUser: any;
  profile: any;
  loggedIn= 0;
  submitted = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authenticationService: AuthenticationService,
    private user: UserService,
    private formBuilder: FormBuilder,
    private alertService: AlertService
  ) {
    let id = this.route.snapshot.paramMap.get('id');
    let email = this.route.snapshot.paramMap.get('email');
    let myUser = {};

    this.currentUser = this.authenticationService.currentUserValue;

    if (this.currentUser == null) { //Not logged in
      if (id != null) {
        this.loggedIn = 0;
        myUser = {
          id,
          email
        }
      } else {
        this.loggedIn = 2;
      }
    } else { // is logged in
      this.loggedIn = 1;

      myUser = {
        id: this.currentUser.id,
        email: this.currentUser.email
      }
    }

    this.currentUser = myUser;
  }

  ngOnInit() {
    if (this.loggedIn < 2) {
      this.resetPassForm = this.formBuilder.group({
        id: ['', Validators.required],
        email: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        passwordConfirm: ['', [Validators.required, Validators.minLength(6)]],
      });

      this.resetPassForm.controls['email'].setValue(this.currentUser.email);
      this.resetPassForm.controls['id'].setValue(this.currentUser.id);
    } else {
      this.resetPassForm = this.formBuilder.group({
        email: ['', Validators.required]
      });
    }
  }

  // convenience getter for easy access to form fields
  get f() { return this.resetPassForm.controls; }

  onSubmit() {
  }

  cancel() {
    this.router.navigate(['/user/profile']);
  }

  requestPasswordChange() {
    this.submitted = true;
    let reqEmail = this.resetPassForm.get('email').value;
    const newUpdate = {
      email: reqEmail,
    };


    this.user.passwordReset(newUpdate).subscribe({
      next: (res) => {
        if (res != null) {
          this.router.navigate(['/login']);
          this.alertService.success('Password Reset Request sent!', true);
        } else {
          this.alertService.error('That Email is not in the system.', true);
        }
      },
      error: (e) => console.error(e)
    });
  }

  changePassword() {
    this.submitted = true;
    let passOriginal = this.resetPassForm.get('password').value;
    let passConfirm = this.resetPassForm.get('passwordConfirm').value;

    if (passOriginal === passConfirm) {
      const newUpdate = {
        id: this.currentUser.id,
        email: this.currentUser.email,
        password: passOriginal
      }
      this.user.update(newUpdate.id, newUpdate).subscribe({
        next: (res) => {
          this.alertService.success('Update successful.', true);
          this.router.navigate(['/user/profile']);
        },
        error: (e) => console.error(e)
      });
    } else {
      this.alertService.error('The passwords did not match.', true);
    }
  }

}
