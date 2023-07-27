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

@Component({
  selector: 'app-songsForm',
  templateUrl: './songs-form.component.html',
  styleUrls: ['./songs-form.component.scss']
 })
export class SongsFormComponent implements OnInit, OnChanges {
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

  adminForm = this.formBuilder.group({});

  startDate = new Date(2022, 0, 1);

  root = environment.root;

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
      private authenticationService: AuthenticationService
  ) {

  }

  ngOnInit() {

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

        this.dataSource.push(this.res);
      }else if(this.act == 'put'){
        this.dataSource = this.dataSource.filter((value,key)=>{
          if(value.id == this.res.id){
            this.displayedColumns.map(res => {
              value[res] = this.res[res];
            })
          }
          return true;
        });
      }else if(this.act == 'delete'){
        this.dataSource = this.dataSource.filter((value,key)=>{
          return value.id != this.res;
        });
      }
      this.table.renderRows();
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

    await this[service].getAll().subscribe(res => {
      res.map((r,i) => {
        if(r.id == 1){
          this.modelSet = r;
        }
      });

      if(this.tool == 'artist_members'){
        res = res.filter(item => {
          if(item.artist_id == this.groupId || item.id == 1){
            return item;
          }
        });
      }

      this[this.tool] = res;
      this.toolSet = this[this.tool];

      if(this.toolSet.length > 1){
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
    this.dataSource.data.shift();
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
    const dialogRef = this.dialog.open(NewItemUpdateComponent, {
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
