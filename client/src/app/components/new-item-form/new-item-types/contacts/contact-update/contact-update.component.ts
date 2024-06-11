import { Component, Input, OnInit, Inject, Optional, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { AlertService } from 'src/app/services/alert.service';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import moment from 'moment';


@Component({
  selector: 'app-contactUpdate',
  templateUrl: './contact-update.component.html',
  styleUrls: ['./contact-update.component.scss']
 })
export class ContactUpdateComponent implements OnInit {
  currentUser: any;
  @Input() record: any;

  adminForm = this.formBuilder.group({});
  newRecord = null;

  displayedColumns: string[] = [];

  action:string;
  tool:string;
  local_data:any;
  currentGroup = null;

  uploaderNeeds = ['image','video','document','song'];
  uploaderInstalled = false;
  modUser=false;

  selectedRelations= '';

  constructor(
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private router: Router,
      private authenticationService: AuthenticationService,
      public dialogRef: MatDialogRef<ContactUpdateComponent>,
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

    console.log('D: ', data)

    Object.keys(data).map(res => {
      this.displayedColumns.push(res)
    })
    this.local_data = [{...data}];

    //this.currentGroup = this.authenticationService.currentUserValue;
      this.currentGroup = {name: this.data.group, id: this.data.owner_id };

    if(data.id != ''){
      this.modUser = true;
    }else{
      this.modUser = false;
    }

    this.requiresUploader();


  }


  doAction(){
    let newContact = {
      owner_user: this.currentUser.id,
      owner_group: this.data.owner_id,
      first_name: this.local_data[0].first_name,
      last_name: this.local_data[0].last_name,
      nickname: this.local_data[0].nickname,
      relation: this.selectedRelations,
      city: this.local_data[0].city,
      phone: this.local_data[0].phone,
      email: this.local_data[0].email,
      active: 1,
      contact_image: this.local_data[0].contact_image,
      profile_url: ('@'+(this.data.group).replace(/\s+/g, '')+'-'+this.local_data[0].first_name+'-'+this.local_data[0].last_name).toLowerCase(),
    };

    if(this.modUser){
      newContact['id'] = this.data.id;
    }

    this.dialogRef.close({event:this.action, data:newContact});
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

  getRelation(e) {
    this.local_data[0]['relation'] = e
    this.selectedRelations = this.local_data[0]['relation'];
  }

}
