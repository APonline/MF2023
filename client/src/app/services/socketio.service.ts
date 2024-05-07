import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { user } from '../models/users.model';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {
  public users$: BehaviorSubject<any> = new BehaviorSubject('');
  public chat$: BehaviorSubject<any> = new BehaviorSubject('');
  public chatTyping$: BehaviorSubject<any> = new BehaviorSubject('');

  socket;
  chat;
  currentUser: user;

  constructor(
    private authenticationService: AuthenticationService,
    private user: UserService
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
  }

  setupSocketConnection(user) {
    this.socket = io(environment.SOCKET_ENDPOINT, {
      auth: {
        token: 'users',
        user
      }
    });

    this.socket.on('my broadcast', (data: string) => {
        console.log(data);
    });

    this.socket.on('get-users', (data: any) => {
      this.users$.next(data);
    });
  }

  setupChatConnection(group, user, chatee, convo) {
    this.chatTyping$.next(false);
    this.chat = io(environment.SOCKET_ENDPOINT, {
      auth: {
        token: 'chat-'+convo,
        group: group,
        userId: user.id,
        username: user.username,
        userImg: user.userImg,
        chatee
      }
    });

    this.chat.on('my broadcast', (data: string) => {
        console.log(data);
    });

    this.chat.on('userIsTyping', (data) => {
      if(data.userId != this.currentUser.id && data.convo == this.chat.auth.token){
        this.chatTyping$.next(true);
        setTimeout(()=> {
          this.chatTyping$.next(false);
        },10000);
      }
    });

    this.chat.on('userHasTyped', (data) => {
      if(data.convo == this.chat.auth.token){
        this.chat$.next(data.msg);
        this.chatTyping$.next(false);

        if(this.currentUser.id == data.userId){
          this.user.updateChatHistoryWith(data.group, this.currentUser.id, data.chatee, {file: data.convo, msg: data.msg}).subscribe(res => {
            console.log('updated file: ',res)
          });
        }
      }
    });

    this.chat.on('get-msg', (data: any) => {
      this.chat$.next(data);
    });
  }

  public getNewUsers = () => {
    this.socket.on('get-users', (data: any) => {
      this.users$.next(data);
    });

    return this.users$.asObservable();
  };

  //chat
  public isTyping = (msg) => {
    this.chat.emit('isTyping', msg);
  }

  public hasTyped = (msg) => {
    this.chat.emit('hasTyped', msg);
  }

  disconnect() {
    if (this.socket) {
        this.socket.disconnect();
        this.chat.disconnect();
    }
  }
}
