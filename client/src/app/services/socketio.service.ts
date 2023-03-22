import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {
  public users$: BehaviorSubject<any> = new BehaviorSubject('');

  socket;

  constructor() {}

  setupSocketConnection(user) {
    this.socket = io(environment.SOCKET_ENDPOINT, {
      auth: {
        token: 'cde',
        user
      }
    });

    this.socket.emit('my message', 'Hello there from Angular.');

    this.socket.on('my broadcast', (data: string) => {
        console.log(data);
    });

    this.socket.on('get-users', (data: any) => {
      this.users$.next(data);
    });
  }

  public getNewUsers = () => {
    this.socket.on('get-users', (data: any) => {
      this.users$.next(data);
    });

    return this.users$.asObservable();
  };

  disconnect() {
    if (this.socket) {
        this.socket.disconnect();
    }
  }
}
