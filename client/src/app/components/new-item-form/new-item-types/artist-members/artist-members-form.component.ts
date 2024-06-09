import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import moment from 'moment';


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
import { FileUploadService } from 'src/app/services/file-upload.service';
import { ArtistMembersUpdateComponent } from './artist-members-update/artist-members-update.component';

@Component({
  selector: 'app-artistMembersForm',
  templateUrl: './artist-members-form.component.html',
  styleUrls: ['./artist-members-form.component.scss']
 })
export class ArtistMembersFormComponent implements OnInit, OnChanges {
  @Output() activeItem = new EventEmitter<any>();

  public currentUser: Observable<any>;
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
  artist: any;

  adminForm = this.formBuilder.group({});

  startDate = new Date(2022, 0, 1);

  root = environment.root;

  constructor(
      public dialog: MatDialog,
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private userService: UserService,
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
      private authenticationService: AuthenticationService,
      private uploadService: FileUploadService,

  ) {
  }

  ngOnInit() {

    this.artistsService.get(this.groupId).subscribe(res => {
      this.artist = res;
    });
    this.loadData();

  }

  ngOnChanges(changes: SimpleChanges) {
    if(this.updateTable){
      if(this.act == 'create'){

        Object.keys(this.res).map(res => {
          if(res == 'createdAt' || res == 'updatedAt' || res == 'active') {
            delete this.res[res];
          }
        });

        this.userService.get(this.res.user_id).subscribe(u => {
          let newRes = {
            'id': this.res.id,
            'user_id': u.id,
            'username': u.username,
            'name': u.first_name + ' ' + u.last_name,
            'role': this.res.role,
            'email': u.email,
            'phone': u.phone,
            'date_joined': this.res.date_joined,
            'profile_url': u.profile_url,
          }

          this.dataSource.push(newRes);
          this.table.renderRows();
        });
      }else if(this.act == 'put'){
        this.dataSource = this.dataSource.filter((value,key)=>{
          if(value.id == this.res.id){
            value['username']= value.username;
            value['name']= value.name;
            value['role']= this.res.role;
            value['email']= value.email;
            value['phone']= value.phone;
            value['date_joined']= this.res.date_joined;
            value['profile_url']= value.profile_url;
          }
          return true;
        });
      }else if(this.act == 'delete'){
        this.dataSource = this.dataSource.filter((value,key)=>{
          return value.id != this.res;
        });
        this.table.renderRows();
      }
    }
  }

  capitalizeWords(arr) {
    return arr.map((word) => {
      const capitalizedFirst = word.charAt(0).toUpperCase();
      const rest = word.slice(1).toLowerCase();
      return capitalizedFirst + rest;
    });
  }

  dateAdjust(date) {
    return moment(date).format("YYYY-MM-DD");
  }

  async loadData() {
    let toolTitle = this.tool.split("_");
    toolTitle = this.capitalizeWords(toolTitle);

    let toolTitle2 = toolTitle.join(',');
    toolTitle2 = toolTitle2.replace(/ /g,"");
    toolTitle2 = toolTitle2.replace(/,/g,"");
    toolTitle2 = toolTitle2.charAt(0).toLowerCase() + toolTitle2.slice(1);
    let service = toolTitle2 + 'Service';
    let model = this.tool;

    await this[service].getAllForArtist(this.groupId).subscribe(res => {
      let cleanData = [];
      res.map((r,i) => {
        if(r.id == 1){
          this.modelSet = r;
        }
        let entry = {
          'id': r.id,
          'user_id': r.user_id,
          'profile_image': r.members.profile_image,
          'username': r.members.username,
          'name': r.members.first_name + ' ' + r.members.last_name,
          'role': r.role,
          'email': r.members.email,
          'phone': r.members.phone,
          'date_joined': r.date_joined,
          'profile_url': r.members.profile_url,
        }
        cleanData.push(entry);
      });

      this[this.tool] = cleanData;
      this.toolSet = this[this.tool];

      if(this.toolSet.length > 0){
        this.setSettings(this.toolSet);
      }else {
        let newForm ={}
        Object.keys(this.modelSet).map(res => {
          if(res != 'createdAt' && res != 'updatedAt' && res != 'active') {
            newForm[res] = '';
          }
        });
        this.newRecord = newForm;
      }
    });

  }

  setSettings(formData){

    let form ={};
    let newForm ={}

    let f = null;
    if(formData.length == 0){
      f = formData;
    }else{
      f = formData[0];
    }

    this.displayedColumns.push('action');
    Object.keys(f).map(res => {
      if(res != 'createdAt' && res != 'updatedAt' && res != 'active') {
        this.displayedColumns.push(res);
        form[res] = new FormControl('');
        newForm[res] = '';
      }
    });

    this.toolSet.map((res,i) => {
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
    obj.owner_user = this.artist?.owner_user;
    obj.artist_id = this.artist?.id;
    obj.user_id = obj?.user_id;
    obj.profile_url = this.artist?.profile_url;
    obj.group = this.artist?.name;
    const dialogRef = this.dialog.open(ArtistMembersUpdateComponent, {
      panelClass: 'dialog-box',
      width: '85%',
      height: '80vh',
      data:obj
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.activeItem.emit({ action: result.event, data: result.data });
      }
    });
  }
}
