import { AfterViewChecked, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { user } from 'src/app/models/users.model';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { Observable, Subscription } from 'rxjs';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { environment } from 'src/environments/environment';
import linkifyit from 'linkify-it';
import { ArtistMembersService } from 'src/app/services/artist_members.service';
import { DomSanitizer } from '@angular/platform-browser';
const linkify = linkifyit();

@Component({
  selector: 'app-messenger',
  templateUrl: 'messenger.component.html',
  styleUrls: ['messenger.component.scss']
})
export class MessengerContainer implements OnInit, AfterViewChecked, OnChanges {
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  @Input() toggle: any;
  chattingSubX: Subscription;
  chatSubX: Subscription;

  myProjects: any = [];
  projectNames = [];
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

  chatSub = false;
  chattingSub = false;

  constructor(
    private authenticationService: AuthenticationService,
    private user: UserService,
    private socketService: SocketioService,
    private uploadService: FileUploadService,
    private projects: ArtistMembersService,
    private sanitizer:DomSanitizer
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
    this.messenger = false;
    this.chaticon = 'arrow_drop_down';

    this.currChatUser = this.defaultUser;

    this.projects.getAllForUser(this.currentUser.id);

    this.projects.projects$.subscribe(r => {
        if(r != undefined && r != ''){
          if(!this.projectNames.includes(r.id)){
            this.projectNames.push(r.id);
            this.myProjects.push(r);
          }
        }
    });

  }

  async ngOnInit() {
    if(environment.production){
      this.socketService.setupSocketConnection(this.currentUser);
      this.userList$ = [];

      this.socketService.getNewUsers().subscribe(async res => {
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

    if(this.currentUser.profile_image != 'default'){
      this.currentUser['userImg'] = 'https://musefactory.app:3001/resources/static/users/'+this.currentUser.id+'/image/'+this.currentUser.profile_image+'';
    }else{
      this.currentUser['userImg'] = 'https://musefactory.app/assets/images/defaultprofile1.png';
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

    this.currChatLog = [];
    this.currNewChatLog = [];

    if(this.chatSub){
      this.chatSubX.unsubscribe();
      this.chatSub = false;
    }

    if(this.chattingSub){
      this.chattingSubX.unsubscribe();
      this.chattingSub = false;
    }

    if(type == 'group'){
      this.currType = 'group';
      this.currChatUser = {
        id: user?.artists?.id,
        name: user?.artists?.name,
        display: user?.display?.display,
        url: user?.artists?.profile_url
      }
      let group = user.artists.profile_url;

      this.user.getChatHistoryWith(group, this.currentUser.id, this.currChatUser.id).subscribe(res => {

        if(res.data != null){
          if(res.data.msgs != null){
            this.currChatLog = res.data.msgs;
            this.scrollToBottom();
          }
        }

        this.socketService.setupChatConnection(group, this.currentUser, this.currChatUser.id, group);

        this.chattingSubX = this.socketService.chatTyping$.subscribe(r => {
          this.chattingSub = true;
          this.currIsTyping = r;
        });

        this.chatSubX = this.socketService.chat$.subscribe(r => {
          this.chatSub = true;
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
        if(res.data != null){
          if(res.data.msgs != null){
            this.currChatLog = res.data.msgs;
            this.scrollToBottom();
          }
        }

        this.socketService.setupChatConnection('user', this.currentUser, this.currChatUser.id, res.title);
        this.chattingSubX = this.socketService.chatTyping$.subscribe(r => {
          this.chattingSub = true;
          this.currIsTyping = r;
        });

        this.chatSubX = this.socketService.chat$.subscribe(r => {
          this.chatSub = true;
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

  async getFileFromUrl(url, name, defaultType = 'image/jpeg'){
    const response = await fetch(url);
    const data = await response.blob();
    return new File([data], name, {
      type: data.type || defaultType,
    });
  }

  async imgBlob(src){
    const file = await this.getFileFromUrl(src, 'user.jpg');
    console.log(file);
    return file;

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

    this.socketService.chat$.next(null);

    this.currChatLog = [];
    this.currNewChatLog = [];

    this.chatSubX.unsubscribe();
    this.chatSub = false;
    this.chattingSubX.unsubscribe();
    this.chattingSub = false;
    this.socketService.chat.disconnect();

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
    this.chatSubX.unsubscribe();
    this.chattingSubX.unsubscribe();
    this.socketService.disconnect();
  }
}
