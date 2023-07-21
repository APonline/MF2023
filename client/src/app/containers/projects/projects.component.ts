import { Component, OnInit } from '@angular/core';
import { user } from 'src/app/models/users.model';
import { AuthenticationService } from '../../services/authentication.service';
import { ArtistMembersService } from 'src/app/services/artist_members.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-projects',
  templateUrl: 'projects.component.html',
  styleUrls: ['projects.component.scss']
})
export class ProjectsContainer implements OnInit {

  currentUser: user;
  myProjects: any = [];

  constructor(
    private authenticationService: AuthenticationService,
    private projects: ArtistMembersService,
    private uploadService: FileUploadService,
  ) {
    this.currentUser = this.authenticationService.currentUserValue;

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

  }

  ngOnDestroy() {
  }
}
