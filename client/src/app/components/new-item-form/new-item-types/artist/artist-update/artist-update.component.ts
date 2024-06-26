import { Component, Input, OnInit, Inject, Optional, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from  '../../../../../services/authentication.service';
import {BACKSLASH, SLASH, COMMA, ENTER} from '@angular/cdk/keycodes';
import { BehaviorSubject, Observable } from 'rxjs';
import { AlertService } from 'src/app/services/alert.service';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import moment from 'moment';
import { ArtistsService } from 'src/app/services/artists.service';
import { UserService } from 'src/app/services/user.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'app-artistUpdate',
  templateUrl: './artist-update.component.html',
  styleUrls: ['./artist-update.component.scss']
 })
export class ArtistUpdateComponent implements OnInit {
  currentUser: any;
  @Input() record: any;

  adminForm = this.formBuilder.group({});
  newRecord = null;
  ownerFound = false;
  userList = [];

  displayedColumns: string[] = [];

  action:string;
  tool:string;
  local_data:any;
  currentGroup = null;

  uploaderNeeds = ['image','video','document','song'];
  uploaderInstalled = false;

  //stepper
  isLinear = true;
  isValid=false;
  modUser=false;
  submitted = false;
  firstFormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    genre: [''],
    location: [''],
    description: [''],
    bio: [''],
  });
  secondFormGroup = this.formBuilder.group({
    profile_image: [''],
    profile_banner_image: [''],
  });

  constructor(
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private router: Router,
      private artistsService: ArtistsService,
      private userService: UserService,
      private uploadService: FileUploadService,
      private authenticationService: AuthenticationService,
      public dialogRef: MatDialogRef<ArtistUpdateComponent>,
      private cdr: ChangeDetectorRef,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.currentUser = this.authenticationService.currentUserValue;

    this.action = data.action;

    ( data.tool.substring(data.tool.length - 1) == 's' ? data.tool = data.tool.slice(0, -1) : data.tool = data.tool);
    this.tool = `${data.tool}`;

    delete data.tool;

    data.owner_user = this.currentUser.id;
    data.active = 1;

    Object.keys(data).map(res => {
      this.displayedColumns.push(res)
    })

    console.log('D: ',data)
    this.local_data = [{...data}];

    //this.currentGroup = this.authenticationService.currentUserValue;
    if(this.tool == 'artist'){
      this.currentGroup = {name: this.local_data[0].name, id: this.local_data[0].id };
    }else{
      this.currentGroup = {name: 'Polarity', id:2};
    }

    this.requiresUploader();

  }

  get f() { return this.firstFormGroup.controls; }


  doAction(){

    // this.artistsService.find(name).subscribe(async res => {
    //   if(res.result != null){
    //     this.userService.get(res.owner_user).subscribe(async res => {
    //       this.ownerFound = true;
    //       if(res.profile_image != 'default'){
    //         await this.uploadService.getFile(0, res.profile_image, 'users/'+res.id, 'png').subscribe(r => {
    //           res['display'] = r[0];

    //           this.userList.push(res)
    //         });
    //       }
    //     });
    //   }else{

        let newEdits = {
          id: this.local_data[0].id,
          bio: this.local_data[0].bio,
          description: this.local_data[0].description,
          genre: this.local_data[0].genre,
          location: this.local_data[0].location,
          name: this.local_data[0].name,
          profile_image: this.local_data[0].profile_image,
          profile_banner_image: this.local_data[0].profile_banner_image
        };

        this.dialogRef.close({event:this.action,data:newEdits});
    //   }
    // });
  }

  closeDialog(){
    this.dialogRef.close({event:'Cancel'});
  }

  async ngOnInit() {
  }

  requiresUploader(){
    if( this.uploaderNeeds.indexOf(this.tool) !== -1 ){
      this.uploaderInstalled = true;
      return true;
    }
  }

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  updateUploadValue(e) {
    this.local_data[0][e.field] = e.val;
  }

  getGenre(e) {
    this.local_data[0]['genre'] = e
  }


}
