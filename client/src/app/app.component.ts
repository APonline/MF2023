import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

import { AuthenticationService } from './services/authentication.service';
import { SocketioService } from './services/socketio.service';
import { User } from 'src/app/models/users.model';

@Component({
  selector: 'app-root',
  animations: [
    trigger('routerAnimation', [
      transition('* <=> *', [
        query(':enter, :leave', style({ position: 'absolute', width: '100vw', left: 0, minHeight: 'calc(100vh - 136px)'}), { optional: true }),
        group([
          query(':enter', [
            style({ opacity: 0 }),
            animate('1.2s ease-in-out', style({ opacity: 1 }))
          ], { optional: true }),
          query(':leave', [
            style({ opacity: 1 }),
            animate('0.3s ease-in-out', style({  opacity: 0 }))
          ], { optional: true }),
        ])
      ])
    ])
  ],
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    currentUser: User;

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        private socketService: SocketioService
    ) {
        //this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
    }

    ngOnInit() {
      this.socketService.setupSocketConnection();
    }

    ngOnDestroy() {
      this.socketService.disconnect();
    }

    logout() {
        this.authenticationService.logout();
        this.router.navigate(['/login']);
    }

    getRouteAnimation(outlet) {
      return outlet.activatedRouteData.animation;
    }
}
