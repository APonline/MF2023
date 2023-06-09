import { Component, OnInit } from '@angular/core';
import { user } from 'src/app/models/users.model';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Observable } from 'rxjs';
import { trigger, group, transition, query, style, animate } from '@angular/animations';

@Component({
  selector: 'app-user',
  animations: [
    trigger('routerAnimation', [
      transition('* <=> *', [
        query(':enter, :leave', style({ position: 'absolute', minHeight: '100%'}), { optional: true }),
        group([
          query(':enter', [
            style({ transform: 'translateX(-100vw)', opacity: 0 }),
            animate('0.9s ease-in-out', style({ transform: 'translateX(-50%)', opacity: 1 }))
          ], { optional: true }),
          query(':leave', [
            style({ transform: 'translateX(-50%)', opacity: 1 }),
            animate('0.4s ease-in-out', style({ transform: 'translateX(-100vw)', opacity: 0 }))
          ], { optional: true }),
        ])
      ])
    ])
  ],
  templateUrl: 'user.component.html',
  styleUrls: ['user.component.scss']
})
export class UserContainer implements OnInit {
  currentUser: user;
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

  async deleteUser(user) {
    await this.user.delete(user);
  }

  getRouteAnimation(outlet) {
    return outlet.activatedRouteData.animation;
  }
}
