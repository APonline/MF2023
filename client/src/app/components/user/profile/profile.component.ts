import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserService } from 'src/app/services/user.service';
import { user } from 'src/app/models/users.model';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.component.html',
  styleUrls: ['profile.component.scss']
})
export class ProfileComponent implements OnInit {
  currentUser: user;
  profileForm: FormGroup;
  editing = 0;
  userProfile: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private user: UserService,
    private alertService: AlertService
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
  }

   ngOnInit() {

    this.profileForm = this.formBuilder.group({
      email: ['', Validators.required],
      username: ['', Validators.required],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      phone: [''],
      city: [''],
      country: [''],
      age: [''],
      gender: [''],
      birthday: [''],
      verified: ['', Validators.required],
      date_joined: ['', Validators.required],
      last_login: ['', Validators.required],
      login_count: ['', Validators.required],
      profile_url: ['', Validators.required],
      profile_img: ['', Validators.required],
    });

    this.profileForm.controls['email'].setValue(this.currentUser.email);
    this.profileForm.controls['username'].setValue(this.currentUser.username);
    this.profileForm.controls['firstname'].setValue(this.currentUser.firstname);
    this.profileForm.controls['lastname'].setValue(this.currentUser.lastname);
    this.profileForm.controls['phone'].setValue(this.currentUser.phone);
    this.profileForm.controls['city'].setValue(this.currentUser.city);
    this.profileForm.controls['country'].setValue(this.currentUser.country);
    this.profileForm.controls['age'].setValue(this.currentUser.age);
    this.profileForm.controls['gender'].setValue(this.currentUser.gender);
    this.profileForm.controls['birthday'].setValue(this.currentUser.birthday);
    this.profileForm.controls['verified'].setValue(this.currentUser.verified);
    this.profileForm.controls['date_joined'].setValue(this.currentUser.date_joined);
    this.profileForm.controls['last_login'].setValue(this.currentUser.last_login);
    this.profileForm.controls['login_count'].setValue(this.currentUser.login_count);
    this.profileForm.controls['profile_url'].setValue(this.currentUser.profile_url);
    this.profileForm.controls['lastname'].setValue(this.currentUser.profile_img);
  }

  // convenience getter for easy access to form fields
  get f() { return this.profileForm.controls; }

  onSubmit() {
  }

  editProfile() {
    this.editing = 1;
  }

  resetPassword() {
    this.editing = 0;
    this.router.navigate(['/user/passwordReset']);
  }

  cancelEdit() {
    this.editing = 0;
  }

  saveEdit() {
    this.editing = 0;
    let firstname = this.profileForm.get('firstname').value;
    let lastname = this.profileForm.get('lastname').value;

    let newUpdate = {
      id: this.currentUser.id,
      name: firstname + ' ' + lastname
    }

    for(let field of Object.keys(this.profileForm.controls)) {
      newUpdate[field] = this.profileForm.get(field).value;
    }

    this.user.update(newUpdate.id, newUpdate).subscribe({
      next: (res) => {
        this.alertService.success('Update successful.', true);
      },
      error: (e) => console.error(e)
    });
  }

  async deleteUser() {
    const user = {
      id: this.currentUser.id,
      email: this.currentUser.email,
      username: this.currentUser.username
    }
    await this.user.delete(user);
    this.router.navigate(['/logout']);
  }

}
