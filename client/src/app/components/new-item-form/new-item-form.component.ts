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

  albums: any = [];
  artist_links: any = [];
  artist_members: any = [];
  artists: any = [];
  comments: any = [];
  contacts: any = [];
  documents: any = [];
  friends: any = [];
  gigs: any = [];
  images: any = [];
  socials: any = [];
  songs: any = [];
  videos: any = [];
  myMaterials: any;
  thisUser: '';
  toolSet: any = [];

  adminForm = this.formBuilder.group({});

  newEditForm = this.formBuilder.group({
    fname: new FormControl('', Validators.required),
    lname: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    mobile_phone: '',
    office_phone: '',
    company: new FormControl('', Validators.required),
    sub_company: '',
    personnel_category: new FormControl('', Validators.required),
    discipline: new FormControl('', Validators.required),
    discipline_category: new FormControl('', Validators.required),
    special_role: new FormControl('', Validators.required),
    permissions: new FormControl('', Validators.required),
    start_date: new FormControl('', Validators.required),
    end_date: new FormControl('', Validators.required),
    srs_package: false,
    atc1_package: false,
    atc2_package: false,
    eg_package: false,
    as_package: false,
    status: '',
    notes: '',
    timestamp: '',
  });

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
        private artistLinksSerivce: ArtistsLinksService,
        private artistMemebersSerivce: ArtistMembersService,
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
      //this.currentUser = this.authenticationService.currentUserValue;

    }

    ngOnInit() {

      this.tool = window.location.href.split('/')[5];
      this.toolName = this.tool.replace(/_/g," ");


      this.loadData();
    }

    async loadData() {
      await this.artistsService.getAll().subscribe(res => {
        this.artists = res;
        if (this.tool=="artists") {
          this.toolSet = this.artists.result;
          this.setSettings(this.toolSet);
        }
      });
      await this.artistMemebersSerivce.getAll().subscribe(res => {
        this.artist_members = res;
        if (this.tool=="artist_members") {
          this.toolSet = this.artist_members.result;
          this.setSettings(this.toolSet);
        }
      });
      await this.artistLinksSerivce.getAll().subscribe(res => {
        this.artist_links = res;
        if (this.tool=="artist_links") {
          this.toolSet = this.artist_links.result;
          this.setSettings(this.toolSet);
        }
      });
      await this.albumsService.getAll().subscribe(res => {
        this.albums = res;
        if (this.tool=="albums") {
          this.toolSet = this.albums.result;
          this.setSettings(this.toolSet);
        }
      });
      await this.songsService.getAll().subscribe(res => {
        this.songs = res;
        if (this.tool=="songs") {
          this.toolSet = this.songs.result;
          this.setSettings(this.toolSet);
        }
      });
      await this.commentsService.getAll().subscribe(res => {
        this.comments = res;
        if (this.tool=="comments") {
          this.toolSet = this.comments.result;
          this.setSettings(this.toolSet);
        }
      });
      await this.contactsService.getAll().subscribe(res => {
        this.contacts = res;
        if (this.tool=="contacts") {
          this.toolSet = this.contacts.result;
          this.setSettings(this.toolSet);
        }
      });
      await this.documentsService.getAll().subscribe(res => {
        this.documents = res;
        if (this.tool=="documents") {
          this.toolSet = this.documents.result;
          this.setSettings(this.toolSet);
        }
      });
      await this.friendsService.getAll().subscribe(res => {
        this.friends = res;
        if (this.tool=="friends") {
          this.toolSet = this.friends.result;
          this.setSettings(this.toolSet);
        }
      });
      await this.gigsService.getAll().subscribe(res => {
        this.gigs = res;
        if (this.tool=="gigs") {
          this.toolSet = this.gigs.result;
          this.setSettings(this.toolSet);
        }
      });
      await this.imagesService.getAll().subscribe(res => {
        this.images = res;
        if (this.tool=="images") {
          this.toolSet = this.images.result;
          this.setSettings(this.toolSet);
        }
      });
      await this.socialsService.getAll().subscribe(res => {
        this.socials = res;
        if (this.tool=="socials") {
          this.toolSet = this.socials.result;
          this.setSettings(this.toolSet);
        }
      });
      await this.videosService.getAll().subscribe(res => {
        this.videos = res;
        if (this.tool=="videos") {
          this.toolSet = this.videos.result;
          this.setSettings(this.toolSet);
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
      Object.keys(f).map(res => {
        if(res != 'createdAt' && res != 'updatedAt' && res != 'active') {
          this.displayedColumns.push(res);
          form[res] = new FormControl('');
          newForm[res] = '';
        }
      });


      this.displayedColumns.push('action');

      this.toolSet.map((res,i) => {
        delete res.active;
        delete res.createdAt;
        delete res.updatedAt;
      })

      this.dataSource = new MatTableDataSource(this.toolSet);
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

      // if (this.tool=="companies") {
      //   this.companyService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="sub_companies") {
      //   this.subCompanyService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="personnel_categories") {
      //   this.personnelService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="disciplines") {
      //   this.discplineService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="discipline_categories") {
      //   this.discplineCatService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="special_roles") {
      //   this.specialRoleService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="permissions") {
      //   this.permissionsService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="statuses") {
      //   this.statusService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="onboarding_material_type") {
      //   this.onboardingMaterialTypeService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="onboarding_materials") {
      //   this.onboardingMaterialService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // }

    }

    update(data) {
      let id = data.id;
      delete data.id;
      delete data.action;

      // if (this.tool=="companies") {
      //   this.companyService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="sub_companies") {
      //   this.subCompanyService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="personnel_categories") {
      //   this.personnelService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="disciplines") {
      //   this.discplineService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="discipline_categories") {
      //   this.discplineCatService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="special_roles") {
      //   this.specialRoleService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="permissions") {
      //   this.permissionsService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="statuses") {
      //   this.statusService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="onboarding_material_type") {
      //   this.onboardingMaterialTypeService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="onboarding_materials") {
      //   this.onboardingMaterialService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // }

    }

    delete(id){
      // if (this.tool=="companies") {
      //   this.companyService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="sub_companies") {
      //   this.subCompanyService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="personnel_categories") {
      //   this.personnelService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="disciplines") {
      //   this.discplineService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="discipline_categories") {
      //   this.discplineCatService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="special_roles") {
      //   this.specialRoleService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="permissions") {
      //   this.permissionsService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="statuses") {
      //   this.statusService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="onboarding_material_type") {
      //   this.onboardingMaterialTypeService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="onboarding_materials") {
      //   this.onboardingMaterialService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // }

    }





    openDialog(action,obj) {
      obj.action = action;
      const dialogRef = this.dialog.open(NewItemUpdateComponent, {
        width: '95%',
        data:obj
      });

      dialogRef.afterClosed().subscribe(result => {
        if(result.event == 'Add'){
          this.addRowData(result.data);
        }else if(result.event == 'Update'){
          this.updateRowData(result.data);
        }else if(result.event == 'Delete'){
          this.deleteRowData(result.data);
        }
      });
    }

    addRowData(row_obj){
      var d = new Date();
      let newRec = {};

      this.displayedColumns.map(res => {
        newRec[res] = row_obj[res];
      })

      newRec['id'] = 0;
      this.dataSource.push(newRec);
      this.table.renderRows();
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
