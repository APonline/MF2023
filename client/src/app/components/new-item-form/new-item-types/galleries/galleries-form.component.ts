import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../../../services/authentication.service';
import { BehaviorSubject, catchError, Observable, of } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import moment from 'moment';

/* services - make dynamic somehow later */
import { ImagesService } from 'src/app/services/images.service';
import { ArtistsService } from 'src/app/services/artists.service';
import { VidoesService } from 'src/app/services/videos.service';
import { GalleriesService } from 'src/app/services/galleries.service';

import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { MatTableDataSource } from '@angular/material/table';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { MFService } from 'src/app/services/MF.service';
import { GalleriesUpdateComponent } from './galleries-update/galleries-update.component';
import { galleries } from 'src/app/models/galleries.model';

@Component({
  selector: 'app-galleriesForm',
  templateUrl: './galleries-form.component.html',
  styleUrls: ['./galleries-form.component.scss']
 })
export class GalleriesFormComponent implements OnInit, OnChanges {
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
  model = galleries;

  constructor(
      public dialog: MatDialog,
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private user: UserService,
      private router: Router,
      private DialogService: DialogService,
      private imagesService: ImagesService,
      private artistsService: ArtistsService,
      private galleriesService: GalleriesService,
      private videosService: VidoesService,
      private authenticationService: AuthenticationService,
      private uploadService: FileUploadService,
      public MF: MFService
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
  }

  //mf-nov7
  ngOnInit() {
    this.imageKey = this.MF.buildImageKey(this.toolName);
    this.artistsService.get(this.groupId).subscribe(res => {
      this.artist = res;
    });
    this.loadData();
  }

  //mf-nov7
  ngOnChanges(changes: SimpleChanges): void {
    this.imageKey = this.MF.buildImageKey(this.toolName);
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

  //mf-nov7
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

  //mf-nov7
  setSettings(formData: any[]) {
    const { displayedColumns, formGroup, newRecord, rows } =
      this.MF.buildFromData(formData?.length ? formData : this.toolSet, {
        exclude: ["active", "createdAt", "updatedAt"],
        includeAction: true,
        pinnedOrder: ["id", "title"],
        modelKeys: this.model.keys(),
        mutateRows: true
      });

    this.displayedColumns = displayedColumns;
    this.adminForm = formGroup;
    this.newRecord = newRecord;
    this.dataSource = new MatTableDataSource(this.toolSet);
    this.dataSource = this.dataSource.data;
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
    const data = this.MF.buildDialogCtx({
        action,
        toolName: this.toolName,
        artist: this.artist,
        currentUser: this.currentUser,
        seed: row
    });

    this.MF
        .openUpdateDialog<typeof data, { event: string; data: any }>(GalleriesUpdateComponent, data)
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
                    views: 0
                })
                .done();

            this.activeItem.emit({ action: result.event, data: cooked });
        });
  }
}
