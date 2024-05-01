import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { Component } from '@angular/core';
import { Subscription } from 'rxjs';

import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';

import { AuthenticationService } from './services/authentication.service';
import { user } from 'src/app/models/users.model';

@Component({
  selector: 'app-root',
  animations: [
    trigger('routerAnimation', [
      transition('* <=> *', [
        query(':enter, :leave', style({ position: 'absolute', left: '0px', width: 'calc(100vw - 0px)', minHeight: 'calc(100vh - 136px)', overflow: 'hidden'}), { optional: true }),
        group([
          query(':enter', [
            style({ opacity: 0 }),
            animate('0.8s ease-in-out', style({ opacity: 1 }))
          ], { optional: true }),
          query(':leave', [
            style({ opacity: 1 }),
            animate('0.5s ease-in-out', style({  opacity: 0 }))
          ], { optional: true }),
        ])
      ])
    ])
  ],
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
    currentUser: user;
    shouldSlide = false;
    //loading = false;
    subscriptions: Subscription[] = [];

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
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
      //         miniload.classList.add('fade');
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
      this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
    }

    logout() {
        this.authenticationService.logout();
        this.router.navigate(['/login']);
    }

    getRouteAnimation(outlet) {
      return outlet.activatedRouteData.animation;
    }

    ngOnDestroy(): void {
      this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
