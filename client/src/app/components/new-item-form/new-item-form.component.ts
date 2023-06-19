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

      this.tool = window.location.href.split('/')[5];
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

      await this[service].getAll().subscribe(res => {

        res.map((r,i) => {
          if(r.id == 1){
            this.modelSet = r;
            //delete res[i];
          }
        });
        //res = res.splice(0,0);



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

    dateAdjust(date) {
      return moment(date).format("YYYY-MM-DD");
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

    createNew(data) {
      delete data.id;
      delete data.action;
      const service = this.tool+'Service';

      this[service].create(data).subscribe(async res => {
        this.dataSource.push(res);
        this.table.renderRows();
        this.alertService.success('Item has been created!', true);
      });

    }

    update(data) {
      let id = data.id;
      delete data.action;
      const service = this.tool+'Service';

      this[service].update(id,data).subscribe(async res => {
        this.table.renderRows();
        this.alertService.success('Item has been updated!', true);
      });

    }

    delete(id){
      const service = this.tool+'Service';

      this[service].delete(id).subscribe(async res => {
        this.alertService.success('Item has been deleted!', true);
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
          if(result.event == 'Add'){
            this.addRowData(result.data);
          }else if(result.event == 'Update'){
            this.updateRowData(result.data);
          }else if(result.event == 'Delete'){
            this.deleteRowData(result.data);
          }
        }
      });
    }

    addRowData(row_obj){
      var d = new Date();
      let newRec = {};

      this.displayedColumns.map(res => {
        newRec[res] = row_obj[res];
      })

      this.createNew(row_obj);
    }
    updateRowData(row_obj){
      this.dataSource = this.dataSource.filter((value,key)=>{
        if(value.id == row_obj.id){
          this.displayedColumns.map(res => {
            value[res] = row_obj[res];
          })
        }
        return true;
      });
      this.update(row_obj);
    }
    deleteRowData(row_obj){
      this.dataSource = this.dataSource.filter((value,key)=>{
        return value.id != row_obj.id;
      });
      this.delete(row_obj.id);
    }
}
