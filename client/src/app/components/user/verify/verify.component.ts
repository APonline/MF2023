import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-verify',
  templateUrl: 'verify.component.html',
  styleUrls: ['verify.component.scss']
})
export class VerifyComponent implements OnInit {
  verified = 0;
  tna = 0;
  currentUser;

  constructor(private router: Router, private route: ActivatedRoute, private authenticationService: AuthenticationService, private user: UserService) {
    this.route.queryParams.subscribe(params => {
      let id = params['id'];
      let username = params['username'];
      let email = params['email'];

      this.currentUser = {
        id,
        username,
        email
      }
      this.user.verify(this.currentUser.id).subscribe({
        next: (res) => {
          this.verified = res.verified;
        },
        error: (e) => console.error(e)
      });

    });
  }

  ngOnInit() {
    this.checkVerified();
  }

  submitTNA() {
    this.user.tna(this.currentUser.id).subscribe({
      next: (res) => {
        this.tna = res.tna;
      },
      error: (e) => console.error(e)
    });
  }

  checkVerified() {
    setTimeout(() => {
      if (this.tna !== 1) {
        this.checkVerified();
      } else {
        this.router.navigate(['/']);
      }
    }, 3000);
  }

}
