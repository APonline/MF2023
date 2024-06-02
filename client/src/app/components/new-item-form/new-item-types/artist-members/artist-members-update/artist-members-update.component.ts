import { Component, Input, OnInit, Inject, Optional, ChangeDetectorRef, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { AlertService } from 'src/app/services/alert.service';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import moment from 'moment';
import { ArtistsService } from 'src/app/services/artists.service';
import { UserService } from 'src/app/services/user.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ArtistMembersService } from 'src/app/services/artist_members.service';

export interface BandRole {
  name: string;
}

@Component({
  selector: 'app-artistMembersUpdate',
  templateUrl: './artist-members-update.component.html',
  styleUrls: ['./artist-members-update.component.scss']
 })
export class ArtistMembersUpdateComponent implements OnInit {
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

  firstFormGroup = this.formBuilder.group({
    user: [{}],
  });
  secondFormGroup = this.formBuilder.group({
    role: [''],
    date_joined: [''],
  });
  selectedUser: any;
  isLinear = true;
  foundUsers = [];
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  bRoles: BandRole[] = [];

  announcer = inject(LiveAnnouncer);

  currYear = new Date().getFullYear();
  years = [];
  months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  days = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31'];

  selectedRoles= '';

  selectedYear=this.currYear+1;
  selectedMonth='01';
  selectedDay='01';
  selectedDateJoined= this.selectedYear+'-'+this.selectedMonth+'-'+this.selectedDay;
  constructor(
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private router: Router,
      private artistsService: ArtistsService,
      private artistMembersService: ArtistMembersService,
      private userService: UserService,
      private uploadService: FileUploadService,
      private authenticationService: AuthenticationService,
      public dialogRef: MatDialogRef<ArtistMembersUpdateComponent>,
      private cdr: ChangeDetectorRef,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    for(let i = 1980; i<this.currYear+1; i++){
      this.years.push(i);
    }
    this.years.reverse();

    this.currentUser = this.authenticationService.currentUserValue;

    this.action = data.action;

    ( data.tool.substring(data.tool.length - 1) == 's' ? data.tool = data.tool.slice(0, -1) : data.tool = data.tool);
    this.tool = `${data.tool}`;

    delete data.tool;

    console.log('WTF: ',data)

    data.owner_user = this.currentUser.id;
    data.active = 1;

    Object.keys(data).map(res => {
      this.displayedColumns.push(res)
    })
    this.local_data = [{...data}];

    this.currentGroup = {owner_user: this.local_data[0].owner_user, name: this.local_data[0].name, artist_id: this.local_data[0].artist_id, profile_url: this.local_data[0].profile_url };

    this.selectedUser = {id:0};
  }

  doAction(){
    console.log(this.currentGroup,this.selectedUser)
    let newMember = {
      owner_user: this.currentGroup.owner_user,
      owner_group: this.currentGroup.artist_id,
      user_id: this.selectedUser.id,
      artist_id: this.currentGroup.artist_id,
      active: 1,
      date_joined: this.selectedDateJoined,
      profile_url: this.currentGroup.profile_url+'-'+this.selectedUser.profile_url,
      role: this.selectedRoles
    };


    this.artistMembersService.create(newMember).subscribe(res => {
      console.log('EDIT THIS UPDATE OF DATA BACK: ', res);
      this.dialogRef.close({event:this.action,data:res});
    })

    // let name = this.local_data[0].name.toLowerCase();
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
    //     this.dialogRef.close({event:this.action,data:this.local_data[0]});
    //   }
    // });
  }

  closeDialog(){
    this.dialogRef.close({event:'Cancel'});
  }

  async ngOnInit() {
  }

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  updateUploadValue(e) {
    this.local_data[0][e.field] = e.val;
  }

  //unique
  get f1() { return this.firstFormGroup.controls; }
  get f2() { return this.secondFormGroup.controls; }

  onTyping(e) {
    this.userService.findUsers(e).subscribe(res => {
      this.foundUsers = res;
    })
  }

  selectUser(user) {
    this.selectedUser = user;
    console.log(this.selectedUser)
    this.firstFormGroup.controls['user'].setValue(user);
  }

  addRole(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || "").trim()) {
      this.bRoles.push({ name: value.trim() });
    }

    // Reset the input value
    if (input) {
      input.value = "";
    }
  }

  removeRole(country: BandRole): void {
    const index = this.bRoles.indexOf(country);

    if (index >= 0) {
      this.bRoles.splice(index, 1);
    }
  }

  updateRoles() {
    let newRoleList = '';
    this.bRoles.map(res => {
      newRoleList = newRoleList + res.name + ' / ';
    });

    newRoleList = newRoleList.slice(0, -3);
    this.selectedRoles = newRoleList;
  }

  onChangeYear(y){
    this.selectedYear = y;
    this.updateSelectedDateJoined();
  }
  onChangeMonth(m){
    this.selectedMonth = m;
    this.updateSelectedDateJoined();
  }
  onChangeDay(d){
    this.selectedDay = d;
    this.updateSelectedDateJoined();
  }

  updateSelectedDateJoined() {
    this.selectedDateJoined = this.selectedYear+'-'+this.selectedMonth+'-'+this.selectedDay;
  }

}
