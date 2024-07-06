import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import moment from 'moment';
import { NewItemUpdateComponent } from '../../../new-item-update/new-item-update.component';


/* services - make dynamic somehow later */
import { ImagesService } from 'src/app/services/images.service';
import { AlbumsService } from 'src/app/services/albums.service';
import { ArtistsLinksService } from 'src/app/services/artist_links.service';
import { ArtistMembersService } from 'src/app/services/artist_members.service';
import { ArtistsService } from 'src/app/services/artists.service';
import { CommentsService } from 'src/app/services/comments.service';
import { ContactsService } from 'src/app/services/contacts.service';
import { DocumentsService } from 'src/app/services/documents.service';
import { FriendsService } from 'src/app/services/friends.service';
import { GigsService } from 'src/app/services/gigs.service';
import { SocialsService } from 'src/app/services/socials.service';
import { SongsService } from 'src/app/services/songs.service';
import { VidoesService } from 'src/app/services/videos.service';

import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { MatTableDataSource } from '@angular/material/table';
import { MFService } from 'src/app/services/MF.service';
import { ImagesUpdateComponent } from './images-update/images-update.component';
import { GalleriesService } from 'src/app/services/galleries.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { user } from 'src/app/models/users.model';

@Component({
  selector: 'app-imagesForm',
  templateUrl: './images-form.component.html',
  styleUrls: ['./images-form.component.scss']
 })
export class ImagesFormComponent implements OnInit, OnChanges {
  @Output() activeItem = new EventEmitter<any>();

  currentUser: user;
  @Input() action: string;
  @Input() editUser: number;

  displayedColumns: string[] = [];
  dataSource=null;
  newRecord=null;

  @ViewChild(MatTable,{static:true}) table: MatTable<any>;

  @Input() updateTable: boolean;
  @Input() res: any;
  @Input() act: any;

  dataReady = false;
  @Input() tool: string;
  @Input() toolName: string;
  modeSubmit = "Submit";
  delUser = false;
  projectTypeClicked = false;

  thisUser: '';
  toolSet: any = [];
  modelSet: any;
  @Input() group: string;
  @Input() groupId: string;

  adminForm = this.formBuilder.group({});

  startDate = new Date(2022, 0, 1);

  root = environment.root;
  artist: any;
  galleries = [];

  constructor(
      public dialog: MatDialog,
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private user: UserService,
      private router: Router,
      private DialogService: DialogService,
      private alertService: AlertService,
      private imagesService: ImagesService,
      private albumsService: AlbumsService,
      private artistLinksService: ArtistsLinksService,
      private artistMembersService: ArtistMembersService,
      private artistsService: ArtistsService,
      private commentsService: CommentsService,
      private contactsService: ContactsService,
      private documentsService: DocumentsService,
      private friendsService: FriendsService,
      private gigsService: GigsService,
      private socialsService: SocialsService,
      private songsService: SongsService,
      private videosService: VidoesService,
      private galleriesService: GalleriesService,
      private uploadService: FileUploadService,
      private authenticationService: AuthenticationService,
      public MF: MFService
  ) {
    this.currentUser = this.authenticationService.currentUserValue;

  }

  ngOnInit() {
    this.artistsService.get(this.groupId).subscribe(res => {
      this.artist = res;
    });
    this.galleriesService.getAllForArtist(this.artist?.id).subscribe(res => {
      this.galleries = res;
    });
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.updateTable){
      if(this.act == 'create'){
        Object.keys(this.res).map(res => {
          if(res == 'createdAt' || res == 'updatedAt' || res == 'active') {
            delete this.res[res];
          }
        });

        this.galleriesService.getAllForArtist(this.artist?.id).subscribe(res => {
          this.galleries = res;

          let galtitle = this.galleries.filter(r => r.id == this.res.owner_gallery)[0];

          this.imagesService.get(this.res.id).subscribe(async u => {
            let newRes = {
              'id': u.id,
              'owner_id': u.owner_id,
              'owner_group': u.owner_group,
              'owner_gallery': u.owner_gallery,
              'gallery': galtitle.title,
              'title': u.title,
              'preview':'',
              'description': u.description,
              'genre': u.genre,
              'tags': u.tags,
              'views': u.views,
              'profile_url': u.profile_url,
              'location_url': u.location_url,
            };

            let type = u.location_url.split('.');
            let format = type[type.length - 1];
            let group = this.artist?.id;
            await this.uploadService.getFile(0, u.location_url, 'artists/'+u.owner_group, format).subscribe(r => {
              newRes.preview = r[0].display;

              this.dataSource.push(newRes);
              this.table.renderRows();
            });
          });
        });

      }else if(this.act == 'put'){
        this.dataSource = this.dataSource.filter((value,key)=>{
          if(value.id == this.res.id){
            this.displayedColumns.map(res => {
              value[res] = this.res[res];
            })
          }
          return true;
        });
        this.table.renderRows();

      }else if(this.act == 'delete'){
        this.dataSource = this.dataSource.filter((value,key)=>{
          return value.id != this.res;
        });
      }
      this.table.renderRows();
    }
  }

  async loadData() {
    let toolTitle = this.tool.split("_");
    toolTitle = this.MF.capitalizeWords(toolTitle);

    let toolTitle2 = toolTitle.join(',');
    toolTitle2 = toolTitle2.replace(/ /g,"");
    toolTitle2 = toolTitle2.replace(/,/g,"");
    toolTitle2 = toolTitle2.charAt(0).toLowerCase() + toolTitle2.slice(1);
    let service = toolTitle2 + 'Service';
    let model = this.tool;

    await this[service].getAllForArtist(this.groupId).subscribe(res => {

      this[this.tool] = res;
      this.toolSet = this[this.tool];

      this.setSettings(this.toolSet);
    });

  }

  async setSettings(formData){
    let form ={};
    let newForm ={}

    let f = null;
    if(formData.length == 0){
      f = formData;
    }else{
      f = formData[0];
    }

    this.displayedColumns.push('action');
    form['action'] = new FormControl('');
    newForm['action'] = '';
    this.displayedColumns.push('id');
    form['id'] = new FormControl('');
    newForm['id'] = '';
    this.displayedColumns.push('owner_user');
    form['owner_user'] = new FormControl('');
    newForm['owner_user'] = '';
    this.displayedColumns.push('owner_group');
    form['owner_group'] = new FormControl('');
    newForm['owner_group'] = '';
    this.displayedColumns.push('gallery');
    form['gallery'] = new FormControl('');
    newForm['gallery'] = '';
    this.displayedColumns.push('title');
    form['title'] = new FormControl('');
    newForm['title'] = '';
    this.displayedColumns.push('preview');
    form['preview'] = new FormControl('');
    newForm['preview'] = '';
    this.displayedColumns.push('description');
    form['description'] = new FormControl('');
    newForm['description'] = '';
    this.displayedColumns.push('genre');
    form['genre'] = new FormControl('');
    newForm['genre'] = '';
    this.displayedColumns.push('extension');
    form['extension'] = new FormControl('');
    newForm['extension'] = '';
    this.displayedColumns.push('tags');
    form['tags'] = new FormControl('');
    newForm['tags'] = '';
    this.displayedColumns.push('views');
    form['views'] = new FormControl('');
    newForm['views'] = '';
    this.displayedColumns.push('profile_url');
    form['profile_url'] = new FormControl('');
    newForm['profile_url'] = '';
    this.displayedColumns.push('location_url');
    form['location_url'] = new FormControl('');
    newForm['location_url'] = '';


    this.toolSet.map(async (res,i) => {
      res.gallery = res.gallery.title;

      let type = res.location_url.split('.');
      let format = type[type.length - 1];
      let group = this.artist?.id;
      await this.uploadService.getFile(0, res.location_url, 'artists/'+group, format).subscribe(r => {
        res.preview = r[0].display;
      });

      delete res.active;
      delete res.createdAt;
      delete res.updatedAt;
    })

    this.dataSource = new MatTableDataSource(this.toolSet);
    this.dataSource = this.dataSource.data;

    this.newRecord = newForm;
    this.adminForm = new FormGroup(form);

  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  openDialog(action,obj) {
    obj.action = action;
    obj.tool = this.toolName;
    obj.groupId = this.artist?.id;
    obj.groupName = this.artist?.name;
    const dialogRef = this.dialog.open(ImagesUpdateComponent, {
      panelClass: 'dialog-box',
      width: '85%',
      height: '80vh',
      data:obj
    });

    dialogRef.afterClosed().subscribe(async result => {
      if(result){
        result.data.profile_url = this.artist?.profile_url+'-'+result.data.title.replace(/\+s/g,'').toLowerCase();;
        result.data.owner_group = this.artist?.id;
        result.data.active = 1;
        result.data.owner_user = this.currentUser.id;
        this.activeItem.emit({ action: result.event, data: result.data });
      }
    });
  }
}
