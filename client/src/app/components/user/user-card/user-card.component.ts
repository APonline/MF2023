import { AfterViewChecked, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { user } from 'src/app/models/users.model';
import { UserService } from '../../../services/user.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { Observable, Subscription } from 'rxjs';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { environment } from 'src/environments/environment';
import linkifyit from 'linkify-it';
import { ArtistMembersService } from 'src/app/services/artist_members.service';
import { DomSanitizer } from '@angular/platform-browser';
const linkify = linkifyit();

@Component({
  selector: 'app-user-card',
  templateUrl: 'user-card.component.html',
  styleUrls: ['user-card.component.scss']
})
export class UserCardComponent implements OnInit {
  @Input() user: any;
  @Input() active: any;

  currentUser: user;
  userList$: any = [];
  userImage: any;
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
    private userService: UserService,
    private socketService: SocketioService,
    private uploadService: FileUploadService,
    private projects: ArtistMembersService,
    private sanitizer:DomSanitizer
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
  }

  async ngOnInit() {

    console.log('U: ',this.user)

    if(this.user.id != 0){
      if(this.user.profile_image != 'default' && this.user.profile_image != undefined){
        await this.uploadService.getFile(0, this.user.profile_image, 'users/'+this.user.id, 'png').subscribe(res => {
          this.user.display = res[0];
        });
      }
    }

  }

}
