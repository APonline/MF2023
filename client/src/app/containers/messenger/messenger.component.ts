import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { user } from 'src/app/models/users.model';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { Observable } from 'rxjs';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-messenger',
  templateUrl: 'messenger.component.html',
  styleUrls: ['messenger.component.scss']
})
export class MessengerContainer implements OnInit, OnChanges {
  @Input() toggle: any;
  currentUser: user;
  userList$: any = [];
  messenger: boolean;
  chaticon: string;
  userImage: any;
  mode='list';
  currChatUser=null;
  defaultUser = {
    username:null,
    firstname: null,
    lastname: null,
    profile_image:null,
    display:{
      name: null
    }
  };

  constructor(
    private authenticationService: AuthenticationService,
    private user: UserService,
    private socketService: SocketioService,
    private uploadService: FileUploadService,
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
    this.messenger = false;
    this.chaticon = 'arrow_drop_down';

    this.currChatUser = this.defaultUser;
  }

  async ngOnInit() {
    if(environment.production){
      this.socketService.setupSocketConnection(this.currentUser);
      this.userList$ = [];

      this.socketService.getNewUsers().subscribe(async res=> {
        console.log(res)
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
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(this.toggle){
      this.messenger = false;
    }else{
      this.messenger = false;
    }
  }

  goToChat(user) {
    this.currChatUser = user;

    setTimeout(()=> {
      this.mode = 'chat';
    }, 250);
  }

  closeChat() {
    this.mode = 'list';

    setTimeout(()=> {
      this.currChatUser = this.defaultUser;
    }, 1000);
  }

  openMessenger() {
    this.messenger = !this.messenger;
    (this.messenger ? this.chaticon = 'arrow_drop_up' : this.chaticon = 'arrow_drop_down');

    if(!this.messenger) {
      // this.mode = 'chathidden';
      // setTimeout(()=>{
      //   this.closeChat();
      // },2000);
    }
  }

  ngOnDestroy() {
    this.socketService.disconnect();
  }
}
