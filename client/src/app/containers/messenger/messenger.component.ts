import { AfterViewChecked, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { user } from 'src/app/models/users.model';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { Observable } from 'rxjs';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { environment } from 'src/environments/environment';
import linkifyit from 'linkify-it';
import { ArtistMembersService } from 'src/app/services/artist_members.service';
const linkify = linkifyit();

@Component({
  selector: 'app-messenger',
  templateUrl: 'messenger.component.html',
  styleUrls: ['messenger.component.scss']
})
export class MessengerContainer implements OnInit, AfterViewChecked, OnChanges {
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  @Input() toggle: any;

  myProjects: any = [];
  currentUser: user;
  userList$: any = [];
  messenger: boolean;
  chaticon: string;
  userImage: any;
  mode='list';
  currChatUser=null;
  currChatLog=null;
  currIsTyping;
  currType;
  myMsg='';
  currNewChatLog=[];
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
    private projects: ArtistMembersService,
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
    this.messenger = false;
    this.chaticon = 'arrow_drop_down';

    this.currChatUser = this.defaultUser;

    this.myProjects = [];
    this.projects.getAllForUser(this.currentUser.id).subscribe( res => {
      for(let i=0; i<res.length; i++){
        if(res[i] != undefined || res[i].owner != 0){
          if(res[i].artists.profile_image != 'default' && res[i].artists.profile_image != ''){
            let group = res[i].artists.name.replace(/\s+/g, '-').toLowerCase();
             this.uploadService.getFile(0, res[i].artists.profile_image, group, 'png').subscribe(r => {
              res[i]['display'] = r[0];
            });
          }else{
            res[i]['display'] = { display: './assets/images/intrologo.png', name: 'default', type: 'png', url: './assets/images/intrologo.png' };
          }
        }
      }

      this.myProjects = res;
    });
  }

  async ngOnInit() {
    if(environment.production){
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
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(this.toggle){
      this.messenger = false;
    }else{
      this.messenger = false;
    }
  }

  scrollToBottom(): void {
    try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
}

  goToChat(user, type) {

    if(type == 'group'){
      this.currType = 'group';
      this.currChatUser = {
        id: user.artists.id,
        name: user.artists.name,
        display: user.display.display,
        url: user.artists.profile_url
      }
      let group = user.artists.profile_url;

      this.user.getChatHistoryWith(group, this.currentUser.id, this.currChatUser.id).subscribe(res => {
        this.currChatLog = res.data.msgs;
        this.scrollToBottom();

        this.socketService.setupChatConnection(group, this.currentUser, this.currChatUser.id, group);
        this.socketService.chatTyping$.subscribe(r => {
          this.currIsTyping = r;
        });

        this.socketService.chat$.subscribe(r => {
          if(r != undefined && r != ''){
            this.currNewChatLog.push(r);
            this.scrollToBottom();
          }
        });
      });

      setTimeout(()=> {
        this.mode = 'chat';
      }, 250);
    }else{
      this.currType = 'user';
      this.currChatUser = user;

      this.user.getChatHistoryWith('user', this.currentUser.id, this.currChatUser.id).subscribe(res => {
        this.currChatLog = res.data.msgs;
        this.scrollToBottom();

        this.socketService.setupChatConnection('user', this.currentUser, this.currChatUser.id, res.title);
        this.socketService.chatTyping$.subscribe(r => {
          this.currIsTyping = r;
        });

        this.socketService.chat$.subscribe(r => {
          if(r != undefined && r != ''){
            this.currNewChatLog.push(r);
            this.scrollToBottom();
          }
        });
      });

      setTimeout(()=> {
        this.mode = 'chat';
      }, 250);
    }

  }

  isTyping(msg) {
    this.socketService.isTyping(msg);
  }

  hasTyped() {
    let msg = this.myMsg;

    let urls = linkify.match(msg);

    if(urls != null) {
      let newval = '<a href="'+urls[0].url+'" target="_new">'+urls[0].url+'</a>';
      msg = msg.replace(urls[0].text, newval);

      this.socketService.hasTyped(msg);
      this.myMsg = '';
      this.scrollToBottom();
    }else{
      this.socketService.hasTyped(msg);
      this.myMsg = '';
      this.scrollToBottom();
    }
  }

  closeChat() {
    this.mode = 'list';

    this.socketService.chat$.unsubscribe();
    this.socketService.chatTyping$.unsubscribe();
    this.socketService.chat.disconnect();
    this.currChatLog = [];
    this.currNewChatLog = [];

    setTimeout(()=> {
      this.currChatUser = this.defaultUser;
    }, 700);
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

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.socketService.disconnect();
  }
}
