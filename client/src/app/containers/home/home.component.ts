import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/users.model';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss']
})
export class HomeContainer implements OnInit {

  currentUser: User;
  userList$: any = [];

  constructor(
    private authenticationService: AuthenticationService,
    private user: UserService,
    private socketService: SocketioService
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
  }

  async ngOnInit() {
    this.socketService.setupSocketConnection(this.currentUser);
    this.userList$ = [];

    this.socketService.getNewUsers().subscribe(res => {
      for(let i=0; i<res.length; i++){
        if(res[i].username == this.currentUser.username){
          res.splice(i, 1);
        }
      }
      this.userList$ = res;
    });

  }

  ngOnDestroy() {
    this.socketService.disconnect();
  }
}
