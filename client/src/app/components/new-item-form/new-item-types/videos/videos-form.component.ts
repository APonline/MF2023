import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';

/* services - make dynamic somehow later */
import { ArtistsService } from 'src/app/services/artists.service';
import { VidoesService } from 'src/app/services/videos.service';

import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { MatTableDataSource } from '@angular/material/table';
import { MFService } from 'src/app/services/MF.service';
import { VideosUpdateComponent } from './videos-update/videos-update.component';
import { GalleriesService } from 'src/app/services/galleries.service';
import { FileUploadService } from 'src/app/services/file-upload.service';

@Component({
  selector: 'app-videosForm',
  templateUrl: './videos-form.component.html',
  styleUrls: ['./videos-form.component.scss']
 })
export class VideosFormComponent implements OnInit, OnChanges {
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
      private artistsService: ArtistsService,
      private videosService: VidoesService,
      private galleriesService: GalleriesService,
      private uploadService: FileUploadService,
      private authenticationService: AuthenticationService,
      public MF: MFService
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
  }

  ngOnInit() {
    this.imageKey = this.MF.buildImageKey(this.toolName);
    this.artistsService.get(this.groupId).subscribe(res => {
      this.artist = res;
    });
    this.galleriesService.get(this.artist?.id).subscribe(res => {
      this.galleries = res;
    });
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.imageKey = this.MF.buildImageKey(this.toolName);
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

          this.videosService.get(this.res.id).subscribe(async u => {
            let newRes = {
              'id': u.id,
              'owner_id': u.owner_id,
              'owner_group': u.owner_group,
              'owner_gallery': u.owner_gallery,
              'gallery': galtitle.title,
              'title': u.title,
              'preview':'',
              'description': u.description,
              'duration': u.duration,
              'genre': u.genre,
              'extension': u.extension,
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
      }else if(this.act == 'delete'){
        this.dataSource = this.dataSource.filter((value,key)=>{
          return value.id != this.res;
        });
      }
      this.table.renderRows();
    }
  }

  //mf-nov7
  async loadData() {
    const serviceName = `${this.tool.split('_').map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('') }Service`;
    console.log(serviceName);

    this.MF.load(this.tool, { scope: 'allForArtist', artistId: this.groupId })
      .subscribe(result => {
          console.log(result.rows); 

          this[this.tool] = result.rows;
          this.toolSet = result.rows;

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
    this.displayedColumns.push('duration');
    form['duration'] = new FormControl('');
    newForm['duration'] = '';
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

  //mf-nov7
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

  //mf-nov7
  openDialog(action: string, row: any) {
    const seed = this.MF
      .compose(row || {})
      .with({ groupId: this.artist?.id, groupName: this.artist?.name })
      .done();

    const data = this.MF.buildDialogCtx({
      action,
      toolName: this.toolName,
      artist: this.artist,
      currentUser: this.currentUser,
      seed
    });

    this.MF
      .openUpdateDialog<typeof data, { event: string; data: any }>(VideosUpdateComponent, data)
      .subscribe(result => {
        if (!result) return;

        const cooked = this.MF
          .compose(result.data)
          .with({
            profile_url: `${this.artist?.profile_url}-${(result.data?.title ?? '')
              .toString()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '')
              .toLowerCase()}`,
            owner_group: this.artist?.id,
            active: 1,
            owner_user: this.currentUser.id
          })
          .done();

          this.activeItem.emit({ action: result.event, data: cooked });
        });
  }
}
