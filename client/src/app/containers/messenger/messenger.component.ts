import { Component, OnInit } from '@angular/core';
import { user } from 'src/app/models/users.model';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { Observable } from 'rxjs';
import { FileUploadService } from 'src/app/services/file-upload.service';

@Component({
  selector: 'app-messenger',
  templateUrl: 'messenger.component.html',
  styleUrls: ['messenger.component.scss']
})
export class MessengerContainer implements OnInit {

  currentUser: user;
  userList$: any = [];
  messenger: boolean;
  chaticon: string;
  userImage: any;

  constructor(
    private authenticationService: AuthenticationService,
    private user: UserService,
    private socketService: SocketioService,
    private uploadService: FileUploadService,
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
    this.messenger = false;
    this.chaticon = 'arrow_drop_down';
  }

  async ngOnInit() {
    this.socketService.setupSocketConnection(this.currentUser);
    this.userList$ = [];

    this.socketService.getNewUsers().subscribe(async res=> {
      for(let i=0; i<res.length; i++){
        if(res[i].username == this.currentUser.username){
          res.splice(i, 1);
        }

        if(res[i] != undefined){
          if(res[i].profile_image != 'default'){
            await this.uploadService.getFile(0, res[i].profile_image, 'users/'+res[i].id, 'png').subscribe(r => {
              res[i]['display'] = r[0];
            });
          }
        }
      }
      this.userList$ = res;
    });

  }


  openMessenger() {
    this.messenger = !this.messenger;
    (this.messenger ? this.chaticon = 'arrow_drop_up' : this.chaticon = 'arrow_drop_down');
  }

  ngOnDestroy() {
    this.socketService.disconnect();
  }
}
