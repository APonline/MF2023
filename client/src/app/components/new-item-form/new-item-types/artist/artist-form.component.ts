import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import moment from 'moment';

import type { artists as ArtistModel } from 'src/app/models/artists.model';

/* services - make dynamic somehow later */
import { ArtistsService } from 'src/app/services/artists.service';
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
      private artistsService: ArtistsService,
      private authenticationService: AuthenticationService,
      private uploadService: FileUploadService,
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
  }

  async ngOnInit() {
    this.imageKey = this.MF.buildImageKey(this.toolName);
    this.artistsService.get(this.groupId).subscribe(res => {
      this.artist = res;
    });

    this.loadData();
  }

  ngOnChanges() {
    this.imageKey = this.MF.buildImageKey(this.toolName);
  }

  async loadData() {
    this.MF.load(this.tool, { scope: 'one', id: this.groupId })
      .subscribe(result => {
        this.modelSet = result.modelSet ?? result.first;
        this[this.tool] = [result.first];
        this.toolSet = this[this.tool];
        this.data = result.first;

        this.currentGroup = (this.tool === 'artist')
            ? { name: this.data?.name, id: this.data?.id }
            : { name: 'Polarity', id: 2 };

        this.getImages(); // keep your existing helper
      });
  }

  getImages() {
    //profile image
    if(this.data.profile_image != 'default' && this.data.profile_image != ''){
      let group = this.data.id;
       this.uploadService.getFile(0, this.data.profile_image, 'artists/'+group, 'png').subscribe(r => {
        this.data['profile_image_img'] = r[0].display;
      });
    }else{
      this.data['profile_image_img'] = './assets/images/intrologo.png';
    }

    //profile banner
    if(this.data.profile_banner_image != 'default' && this.data.profile_banner_image != ''){
      let group = this.data.id;
       this.uploadService.getFile(0, this.data.profile_banner_image, 'artists/'+group, 'png').subscribe(r => {
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

  openDialog(action: 'Update' | 'Add') {
    const seed = this.MF.clone(this.artist[0]); // your base row
    const data = this.MF.buildDialogCtx({
        action,
        toolName: this.toolName,
        artist: this.artist?.[0],
        seed
    });

    this.MF.openUpdateDialog<typeof data, { event: string; data: Partial<ArtistModel> }>(
        ArtistUpdateComponent,
        data
    ).subscribe(result => {
        if (!result) return;

        // merge returned fields into current view model
        // skip transient display-only properties
        this.MF.patchFrom<ArtistModel>(
            this.data,
            result.data,
            ['profile_image_img', 'profile_banner_image_img'] as any
        );

        // fire event for backend save
        this.activeItem.emit({ action: result.event, data: result.data });
    });
  }
}
 