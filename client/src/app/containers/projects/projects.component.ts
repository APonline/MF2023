import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { user } from 'src/app/models/users.model';
import { AuthenticationService } from '../../services/authentication.service';
import { ArtistMembersService } from 'src/app/services/artist_members.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { NewProjectUpdateComponent } from '../../components/new-project-update/new-project-update.component';
import { AlertService } from 'src/app/services/alert.service';
import { ArtistsService } from 'src/app/services/artists.service';
import { MFService } from 'src/app/services/MF.service';
import { Router } from '@angular/router';
import { GalleriesService } from 'src/app/services/galleries.service';

@Component({
  selector: 'app-projects',
  templateUrl: 'projects.component.html',
  styleUrls: ['projects.component.scss']
})
export class ProjectsContainer implements OnInit {
  @Output() activeItem = new EventEmitter<any>();
  currentUser: user;
  myProjects: any = [];
  newRecord=null;

  currYear = new Date().getFullYear();
  selectedYear=this.currYear;
  selectedMonth='01';
  selectedDay='01';
  selectedDateJoined= this.selectedYear+'-'+this.selectedMonth+'-'+this.selectedDay;

  constructor(
    public dialog: MatDialog,
    private authenticationService: AuthenticationService,
    private projects: ArtistMembersService,
    private uploadService: FileUploadService,
    private alertService: AlertService,
    private mfService: MFService,
    private artistsService: ArtistsService,
    private artistMembersService: ArtistMembersService,
    private galleriesService: GalleriesService,
    private router: Router,
  ) {
    this.currentUser = this.authenticationService.currentUserValue;

    this.myProjects = [];
    this.projects.getAllForUser(this.currentUser.id).subscribe( res => {
      for(let i=0; i<res.length; i++){
        if(res[i] != undefined || res[i].owner != 0){
          if(res[i].artists.profile_image != 'default' && res[i].artists.profile_image != ''){
            let type = res[i].artists.profile_image.split('.');
            let format = type[type.length - 1];
            console.log(0, res[i].artists.profile_image, 'artists/'+res[i].artist_id, format, 'ARTST:',res[i].name)
            this.uploadService.getFile(0, res[i].artists.profile_image, 'artists/'+res[i].artist_id, format).subscribe(r => {
              console.log(r)
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
    let newForm ={
      name: null,
      genre: null,
    }
    this.newRecord = newForm;
  }

  ngOnDestroy() {
  }

  openDialog(action, obj) {

      obj.action = action,
      obj.tool = 'project'

    const dialogRef = this.dialog.open(NewProjectUpdateComponent, {
      panelClass: 'dialog-box',
      width: '85%',
      height: '80vh',
      data:obj
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.createNew(result.data);
      }
    });
  }

  createNew(data) {
    delete data.id;
    delete data.action;
    const service = 'artistsService';
    data.owner_user = this.currentUser.id;
    data.profile_url = '@'+data.name.replace(/ /g,'').toLowerCase();
    data.date_joined = this.mfService.getDate();
    data.active = 1;

    this.artistsService.create(data).subscribe(async res => {
      this.alertService.success('Item has been created!', true);

      let data2 = {
        owner_user: this.currentUser.id,
        owner_group: res.id,
        user_id: this.currentUser.id,
        artist_id: res.id,
        active: 1,
        date_joined: this.mfService.getDate(),
        profile_url: res.profile_url+'-'+this.currentUser.profile_url
      };


      //create default gallery for images and docs
      let gal = {
        owner_user: this.currentUser.id,
        owner_group: res.id,
        title: 'misc',
        description: 'Uncategorized uploaded items',
        active: 1,
        tags: '',
        views: 0,
        profile_url: res.profile_url+'-misc'
      };

      this.galleriesService.create(gal).subscribe(async res => {});

      this.projects.create(data2).subscribe(async res2 => {

        this.projects.getAllForUser(this.currentUser.id).subscribe( res3 => {
          for(let i=0; i<res.length; i++){
            if(res3[i] != undefined || res3[i].owner != 0){
              if(res3[i].artists.profile_image != 'default' && res3[i].artists.profile_image != ''){
                let type = res3[i].artists.profile_image.split('.');
                let format = type[type.length - 1];
                this.uploadService.getFile(0, res3[i].artists.profile_image, 'artists/'+res3[i].id, format).subscribe(r => {
                  res3[i]['display'] = r[0];
                });
              }else{
                res3[i]['display'] = { display: './assets/images/intrologo.png', name: 'default', type: 'png', url: './assets/images/intrologo.png' };
              }
            }
          }

          this.myProjects = res3;
        });

        setTimeout(()=>{
          this.router.navigate(['/projects/'+res.id+'/'+res.profile_url]);
        },1000)
      })
    });
  }
}
