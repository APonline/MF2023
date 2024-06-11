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
import { MFService } from 'src/app/services/MF.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { ArtistUpdateComponent } from './artist-update/artist-update.component';

@Component({
  selector: 'app-artistForm',
  templateUrl: './artist-form.component.html',
  styleUrls: ['./artist-form.component.scss']
 })
export class ArtistFormComponent implements OnInit {
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

  startDate = new Date(2022, 0, 1);

  root = environment.root;

  uploaderNeeds = ['image','video','document','song'];
  uploaderInstalled = false;

  editing = 0;
  myForm: FormGroup;
  data: any;
  currentGroup = null;
  artist: any;

  constructor(
      public dialog: MatDialog,
      private formBuilder: FormBuilder,
      public MF: MFService,
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
      private uploadService: FileUploadService,
  ) {

  }

  async ngOnInit() {
    this.artistsService.get(this.groupId).subscribe(res => {
      this.artist = res;
    });

    this.loadData();
  }

  async loadData() {
    let toolTitle = this.tool.split("_");
    toolTitle = this.MF.capitalizeWords(toolTitle);

    let toolTitle2 = toolTitle.join(',');
    toolTitle2 = toolTitle2.replace(/ /g,"");
    toolTitle2 = toolTitle2.replace(/,/g,"");
    toolTitle2 = toolTitle2.charAt(0).toLowerCase() + toolTitle2.slice(1);
    let service = toolTitle2+ 's' + 'Service';

    await this[service].get(this.groupId).subscribe(res => {
      this.modelSet = res;

      this[this.tool] = [res];
      this.toolSet = this[this.tool];
      this.data = this.toolSet[0]

      if(this.tool == 'artist'){
        this.currentGroup = {name: this.data.name, id: this.data.id };
      }else{
        this.currentGroup = {name: 'Polarity', id:2};
      }

      this.getImages();
    });
  }

  getImages() {
    //profile image
    if(this.data.profile_image != 'default' && this.data.profile_image != ''){
      let group = this.data.name.replace(/\s+/g, '-').toLowerCase();
       this.uploadService.getFile(0, this.data.profile_image, group, 'png').subscribe(r => {
        this.data['profile_image_img'] = r[0].display;
      });
    }else{
      this.data['profile_image_img'] = './assets/images/intrologo.png';
    }

    //profile banner
    if(this.data.profile_banner_image != 'default' && this.data.profile_banner_image != ''){
      let group = this.data.name.replace(/\s+/g, '-').toLowerCase();
       this.uploadService.getFile(0, this.data.profile_banner_image, group, 'png').subscribe(r => {
        this.data['profile_banner_image_img'] = r[0].display;
      });
    }else{
      this.data['profile_banner_image_img'] = './assets/images/intrologo.png';
    }
  }

  updateUploadValue(e) {
    this.data[e.field] = e.val;
  }

  get f() { return this.myForm.controls; }

  onSubmit(){
  }

  editProfile() {
    this.editing = 1;
  }

  cancelEdit() {
    this.editing = 0;
  }

  openDialog(action) {
    let obj = JSON.parse(JSON.stringify(this.artist[0]))
    obj.action = action;
    obj.tool = this.toolName;

    const dialogRef = this.dialog.open(ArtistUpdateComponent, {
      panelClass: 'dialog-box',
      width: '85%',
      height: '80vh',
      data:obj
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        let newUpdate = JSON.parse(JSON.stringify(result.data))

        this.data.name = newUpdate.name;
        this.data.genre = newUpdate.genre;
        this.data.location = newUpdate.location;
        this.data.description = newUpdate.description;
        this.data.bio = newUpdate.bio;
        this.data.profile_image = newUpdate.profile_image;
        this.data.profile_image_img = newUpdate.profile_image_img;
        this.data.profile_banner_image = newUpdate.profile_banner_image;
        this.data.profile_banner_image_img = newUpdate.profile_banner_image_img;

        delete result.data.profile_image_img;
        delete result.data.profile_banner_image_img;
        this.activeItem.emit({ action: result.event, data: result.data });
      }
    });
  }
}
