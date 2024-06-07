import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-invite',
  templateUrl: 'invite.component.html',
  styleUrls: ['invite.component.scss']
})
export class InviteComponent implements OnInit {
  @Input() group: any;
  @ViewChild('formDirective') private formDirective: NgForm;

  inviteForm: FormGroup;
  currentUser: any;
  profile: any;
  loggedIn= 0;
  submitted = false;
  inviteSent = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authenticationService: AuthenticationService,
    private user: UserService,
    private formBuilder: FormBuilder,
    private alertService: AlertService
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
  }

  ngOnInit() {
    this.inviteForm = this.formBuilder.group({
      email: ['', Validators.required]
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.inviteForm.controls; }

  onSubmit() {
  }

  cancel() {
    this.router.navigate(['/user/profile']);
  }

  sendInvite() {
    this.submitted = true;
    this.inviteSent = true;
    let reqEmail = this.inviteForm.get('email').value;
    const myInvite = {
      email: reqEmail,
      who: this.currentUser.firstname + ' ' + this.currentUser.lastname,
      group: this.group
    };

    this.user.invite(myInvite).subscribe((res) =>{
      this.formDirective.resetForm();
      this.inviteForm.reset();
      setTimeout(()=>{
        this.inviteSent = false;
      },6000)

      if (res != null) {
        this.alertService.success('Invite sent!', true);
      } else {
        this.alertService.error('The Invite could note be sent.', true);
      }
    });
  }

}
