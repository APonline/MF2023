import { Component, Input, OnInit, Inject, Optional, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { AlertService } from 'src/app/services/alert.service';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import moment from 'moment';


@Component({
  selector: 'app-newItemUpdate',
  templateUrl: './new-item-update.component.html',
  styleUrls: ['./new-item-update.component.scss']
 })
export class NewItemUpdateComponent implements OnInit {
  currentUser: any;
  @Input() record: any;

  adminForm = this.formBuilder.group({});
  newRecord = null;

  displayedColumns: string[] = [];

  action:string;
  tool:string;
  local_data:any;
  currentGroup = null;

  constructor(
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private router: Router,
      private authenticationService: AuthenticationService,
      public dialogRef: MatDialogRef<NewItemUpdateComponent>,
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
    this.local_data = [{...data}];

    console.log('TEST: ',this.displayedColumns, this.local_data);

    //this.currentGroup = this.authenticationService.currentUserValue;
    if(this.tool == 'artist'){
      this.currentGroup = this.local_data[0].name;
    }else{
      this.currentGroup = 'Polarity';
    }


  }


  doAction(){
    this.dialogRef.close({event:this.action,data:this.local_data[0]});
  }

  closeDialog(){
    this.dialogRef.close({event:'Cancel'});
  }

  async ngOnInit() {
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

  updateImageValue(e) {
    this.local_data[0][e.field] = e.val;

    console.log('updated item: ',e);
    console.log(this.local_data[0])
  }

}
