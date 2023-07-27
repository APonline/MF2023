import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import moment from 'moment';
import { NewItemUpdateComponent } from '../new-item-update/new-item-update.component';


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
  selector: 'app-newItemForm',
  templateUrl: './new-item-form.component.html',
  styleUrls: ['./new-item-form.component.scss']
 })
export class NewItemFormComponent implements OnInit {
  public currentUser: Observable<any>;
  @Input() action: string;
  @Input() editUser: number;

  displayedColumns: string[] = [];
  dataSource=null;
  newRecord=null;

  @ViewChild(MatTable,{static:true}) table: MatTable<any>;

  dataReady = false;
  tool = "";
  toolName = "";
  modeSubmit = "Submit";
  delUser = false;
  projectTypeClicked = false;

  thisUser: '';
  toolSet: any = [];
  modelSet: any;
  group = null;
  groupId = null;
  updateTable = false;
  res: any;
  act: string;

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
        private authenticationService: AuthenticationService,
    ) {
      //this.currentUser = this.authenticationService.currentUserValue;

    }

    ngOnInit() {

      this.groupId = window.location.href.split('/')[5];
      this.group = window.location.href.split('/')[6].replace(/_/g," ").replace(/@/g,"");
      this.tool = window.location.href.split('/')[7];
      this.toolName = this.tool.replace(/_/g," ");

      this.loadData();

    }

    capitalizeWords(arr) {
      return arr.map((word) => {
        const capitalizedFirst = word.charAt(0).toUpperCase();
        const rest = word.slice(1).toLowerCase();
        return capitalizedFirst + rest;
      });
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

    }

    takeAction(obj) {
      if(obj){
        if(obj.action == 'Add'){
          this.createNew(obj.data);
        }else if(obj.action == 'Update'){
          this.update(obj.data);
        }else if(obj.action == 'Delete'){
          this.delete(obj.data.id);
        }
      }
    }


    //CREATE
    createNew(data) {
      delete data.id;
      delete data.action;
      let t = this.tool.split('_');
      let tName = t[0] + t[1].charAt(0).toUpperCase() + t[1].slice(1);
      const service = tName+'Service';

      this[service].create(data).subscribe(async res => {
        this.act = 'create';
        this.res = res;
        this.updateTable = true;
        this.alertService.success('Item has been created!', true);
      });
    }

    //UPDATE
    update(data) {
      let id = data.id;
      delete data.action;
      let t = this.tool.split('_');
      let tName = t[0] + t[1].charAt(0).toUpperCase() + t[1].slice(1);
      const service = tName+'Service';

      this[service].update(id,data).subscribe(async res => {
        this.act = 'put';
        this.res = data;
        this.updateTable = true;
        this.alertService.success('Item has been updated!', true);
      });

    }

    //DELETE
    delete(id){
      let t = this.tool.split('_');
      let tName = t[0] + t[1].charAt(0).toUpperCase() + t[1].slice(1);
      const service = tName+'Service';

      this[service].delete(id).subscribe(async res => {
        this.act = 'delete';
        this.res = id;
        this.updateTable = true;
        this.alertService.success('Item has been deleted!', true);
      });

    }
}
