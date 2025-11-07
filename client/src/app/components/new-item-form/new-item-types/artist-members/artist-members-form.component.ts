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
import { artist_members } from 'src/app/models/artist_members.model';
import { ArtistActivityService } from 'src/app/services/artist_activity.service';
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

import { MFService } from 'src/app/services/MF.service';
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

  currentUser: any;
  imageKey = '';
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
  model = artist_members;

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
      private artistActivityService: ArtistActivityService,
      private artistsService: ArtistsService,
      private authenticationService: AuthenticationService,
      private uploadService: FileUploadService,
      public MF: MFService
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
  }

  ngOnInit() {
    this.imageKey = this.MF.buildImageKey(this.toolName);
    this.artistsService.get(this.groupId).subscribe(res => {
      this.artist = res;
    });
    this.loadData();

  }

  ngOnChanges(changes: SimpleChanges) {
    this.imageKey = this.MF.buildImageKey(this.toolName);
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
          this.artistActivityService
            .logMemberChange('create', { username: u.username }, {
                actor: { id: this.currentUser.id, username: this.currentUser.username },
                artistId: this.groupId,
                groupId: this.groupId,
                feature: { feature: this.toolName.replace(/s$/i, ""), extra: null}
            })
            .subscribe();
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

            this.artistActivityService
              .logMemberChange('update', { username: value.username }, {
                  actor: { id: this.currentUser.id, username: this.currentUser.username },
                  artistId: this.groupId,
                  groupId: this.groupId,
                feature: { feature: this.toolName.replace(/s$/i, ""), extra: null}
              })
              .subscribe();
          }
          return true;
        });
      }else if(this.act == 'delete'){
        this.dataSource = this.dataSource.filter((value,key)=>{
          this.artistActivityService
            .logMemberChange('delete', { username: value.username }, {
                actor: { id: this.currentUser.id, username: this.currentUser.username },
                artistId: this.groupId,
                groupId: this.groupId,
                feature: { feature: this.toolName.replace(/s$/i, ""), extra: null}
            })
            .subscribe();
          return value.id != this.res;
        });
        this.table.renderRows();
      }
    }
  }

  dateAdjust(date) {
    return moment(date).format("YYYY-MM-DD");
  }

  async loadData() {
    this.MF.load(this.tool, { scope: 'allForArtist', artistId: this.groupId })
      .subscribe(result => {
        this.modelSet = result.modelSet;
        this[this.tool] = result.rows;
        this.toolSet = result.rows;

        if (this.toolSet.length > 0) {
          // attach previews (your existing snippet)
          for (const row of this.toolSet) {
              if (row.profile_image && row.profile_image !== 'default') {
                  const type = row.profile_image.split('.').pop();
                  this.uploadService.getFile(0, row.profile_image, 'users/' + row.user_id, type)
                      .subscribe(r => row.preview = r[0].display);
              } else {
                  row.preview = './assets/images/defaultprofile1.png';
              }
          }

          const scaffold = this.MF.buildTableScaffold(this.toolSet, [
              'username','preview','name','role','email','phone','date_joined','profile_url'
          ]);
          this.displayedColumns = scaffold.displayedColumns;
          this.adminForm = scaffold.adminForm;
          this.newRecord = scaffold.newRecord;
          this.dataSource = scaffold.dataSource;
        } else {
          this.newRecord = this.MF.buildEmptyFromModel(this.modelSet);
        }
      });
  }

  setSettings(formData: any[]) {
    const { displayedColumns, formGroup, newRecord, rows } =
      this.MF.buildFromData(formData?.length ? formData : this.toolSet, {
        exclude: ["active", "createdAt", "updatedAt"],
        includeAction: true,
        pinnedOrder: ["id", "title"],     // optional – pin important fields first
        modelKeys: this.model.keys(),
        mutateRows: true                   // keep your existing “delete fields from this.toolSet”
      });

    // keep your existing expectations
    this.displayedColumns = displayedColumns;
    this.adminForm = formGroup;
    this.newRecord = newRecord;

    // Use your original toolSet reference for the table, but rows are already cleaned
    // If you want to keep EXACT reference semantics:
    // this.toolSet = rows; // rows === toolSet if mutateRows:true
    this.dataSource = new MatTableDataSource(this.toolSet);
    this.dataSource = this.dataSource.data;
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

  openDialog(action: string, row: any) {
    const data = this.MF.buildDialogCtx({
      action,
      toolName: this.toolName,
      artist: this.artist,      // has id/name/profile_url/owner_user
      seed: row                 // the clicked row
    });

    this.MF.openUpdateDialog<typeof data, { event: string; data: any }>(
      ArtistMembersUpdateComponent,
      data
    ).subscribe(result => {
      if (!result) return;
      this.activeItem.emit({ action: result.event, data: result.data });
    });
  }
}
