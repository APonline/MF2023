import { Component, OnInit } from '@angular/core';
import { user } from 'src/app/models/users.model';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Observable, Subscription } from 'rxjs';
import { trigger, group, transition, query, style, animate } from '@angular/animations';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';

@Component({
  selector: 'app-user',
  animations: [
    trigger('routerAnimation', [
      transition('* <=> *', [
        //query(':enter, :leave', style({ position: 'absolute', minHeight: '100%'}), { optional: true }),
        // group([
        //   query(':enter', [
        //     style({ transform: 'translateX(-100vw)', opacity: 0 }),
        //     animate('0.9s ease-in-out', style({ transform: 'translateX(-50%)', opacity: 1 }))
        //   ], { optional: true }),
        //   query(':leave', [
        //     style({ transform: 'translateX(-50%)', opacity: 1 }),
        //     animate('0.4s ease-in-out', style({ transform: 'translateX(-100vw)', opacity: 0 }))
        //   ], { optional: true }),
        // ])
        group([
          query(':enter', [
            style({ opacity: 0 }),
            animate('1.8s ease-in-out', style({ opacity: 1 }))
          ], { optional: true }),
          query(':leave', [
            style({ opacity: 1 }),
            animate('0.5s ease-in-out', style({  opacity: 0 }))
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
  shouldSlide = false;
  //loading = false;
  subscriptions: Subscription[] = [];

  constructor(
    private authenticationService: AuthenticationService,
    private user: UserService,
    private router: Router,
  ) {
    // show loading spinner when redirecting
    // let routerSub: Subscription;
    // routerSub = this.router.events.subscribe(e  => {
    //   switch (true) {
    //     case e instanceof NavigationStart: {
    //       this.loading = true;
    //       break;
    //     }
    //     case e instanceof NavigationEnd:
    //     case e instanceof NavigationCancel:
    //     case e instanceof NavigationError: {
    //       setTimeout(() => {
    //         const miniload = document.getElementById('miniLoading');
    //         miniload.classList.toggle('fade');
    //         setTimeout(() => {
    //           this.loading = false;
    //         }, 1200);
    //       }, 10);
    //       break;
    //     }
    //     default: {
    //       break;
    //     }
    //   }
    // });
    // this.subscriptions.push(routerSub);
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
