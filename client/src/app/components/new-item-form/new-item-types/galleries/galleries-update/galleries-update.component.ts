import { Component, Input, OnInit, Inject, Optional, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { AlertService } from 'src/app/services/alert.service';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import moment from 'moment';
import { GalleriesService } from 'src/app/services/galleries.service';


@Component({
  selector: 'app-galleriesUpdate',
  templateUrl: './galleries-update.component.html',
  styleUrls: ['./galleries-update.component.scss']
 })
export class GalleriesUpdateComponent implements OnInit {
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

  selectedTags= '';
  selectedGenres= '';

  constructor(
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private router: Router,
      private authenticationService: AuthenticationService,
      public dialogRef: MatDialogRef<GalleriesUpdateComponent>,
      private cdr: ChangeDetectorRef,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.currentUser = this.authenticationService.currentUserValue;

    this.action = data.action;

    if(data.tool.toLowerCase() === 'galleries'){
      data.tool = data.tool.slice(0, -3) + 'y';
    }else{
      ( data.tool.substring(data.tool.length - 1) == 's' ? data.tool = data.tool.slice(0, -1) : data.tool = data.tool);
    }

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
    if(this.tool == 'artist'){
      this.currentGroup = {name: this.local_data[0].name, id: this.local_data[0].id };
    }else{
      this.currentGroup = {name: 'Polarity', id:2};
    }

    if(data.id != ''){
      this.modUser = true;
    }else{
      this.modUser = false;
    }

    this.requiresUploader();


  }


  doAction(){

    // if(this.modUser){
    //   newContact['id'] = this.data.id;
    // }

    this.dialogRef.close({event:this.action,data:this.local_data[0]});
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

  getDate() {
    let today = new Date();
    let day = '';
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = 0 + dd;
    if (mm < 10) mm = 0 + mm;

    return day = yyyy + '-' + mm + '-' + dd;
  }
  dateAdjust(date) {
    return moment(date).format("YYYY-MM-DD");
  }

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  updateUploadValue(e) {
    this.local_data[0][e.field] = e.val;
  }

  getTag(e) {
    this.local_data[0]['tags'] = e
    this.selectedTags = this.local_data[0]['tags'];
  }

  getGenre(e) {
    this.local_data[0]['genre'] = e
    this.selectedGenres = this.local_data[0]['genre'];
  }

}
