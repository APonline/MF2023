import { Component, Input, OnInit, Inject, Optional, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { AlertService } from 'src/app/services/alert.service';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import moment from 'moment';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { ImagesService } from 'src/app/services/images.service';


@Component({
  selector: 'app-imageUpdate',
  templateUrl: './image-update.component.html',
  styleUrls: ['./image-update.component.scss']
 })
export class ImageUpdateComponent implements OnInit {
  currentUser: any;
  @Input() record: any;
  @Input() field: string;
  @Output() fileNew = new EventEmitter<any>();

  adminForm = this.formBuilder.group({});
  newRecord = null;

  displayedColumns: string[] = [];

  action:string;
  tool:string;
  local_data:any;
  currentGroup = null;

  uploaderNeeds = ['image','video','document','song'];
  uploaderInstalled = false;

  selectedFiles?: FileList;
  progressInfos: any[] = [];
  message: string[] = [];
  previews: string[] = [];
  fileInfos?: Observable<any>;

  imagesTypes = ['jpg','jpeg','JPG','png','gif','tiff','svg'];

  constructor(
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private router: Router,
      private alertService: AlertService,
      private uploadService: FileUploadService,
      private imagesService: ImagesService,
      private authenticationService: AuthenticationService,
      public dialogRef: MatDialogRef<ImageUpdateComponent>,
      private cdr: ChangeDetectorRef,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.currentUser = this.authenticationService.currentUserValue;

    this.action = data.action;

    delete data.tool;

    data.owner_user = this.currentUser.id;
    data.active = 1;

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

    this.requiresUploader();
  }


  doAction(){
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

  dateAdjust(date) {
    return moment(date).format("YYYY-MM-DD");
  }

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  updateUploadValue(e) {
    this.local_data[0][e.field] = e.val;
  }


  ////uploader
  selectFiles(event: any): void {
    this.message = [];
    this.progressInfos = [];
    this.selectedFiles = event.target.files;

    this.previews = [];
    if (this.selectedFiles && this.selectedFiles[0]) {
      const numberOfFiles = this.selectedFiles.length;
      for (let i = 0; i < numberOfFiles; i++) {
        const reader = new FileReader();

        reader.onload = (e: any) => {
          this.previews.push(e.target.result);
        };

        reader.readAsDataURL(this.selectedFiles[i]);
      }
    }
  }

  uploadFiles(): void {
    this.message = [];

    if (this.selectedFiles) {
      for (let i = 0; i < this.selectedFiles.length; i++) {
        this.upload(i, this.selectedFiles[i]);
      }
    }
  }

  upload(idx: number, file: File): void {
    this.progressInfos[idx] = { value: 0, fileName: file.name };


    if (file) {
      let type = file.name.split('.').pop();
      let group = this.currentGroup.name.replace(/\s+/g, '-').toLowerCase();
      this.uploadService.upload(file,group,type).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.progressInfos[idx].value = Math.round(100 * event.loaded / event.total);
          } else if (event instanceof HttpResponse) {
            const msg = 'Uploaded the file successfully: ' + file.name;
            this.message.push(msg);
            //this.fileInfos = this.uploadService.getFiles();
            this.fileInfos = this.uploadService.getFile(0,file.name, group, type);

            let obj = {
              field: this.field,
              val:file.name
            }
            this.fileNew.emit(obj);
            this.saveToDB(file.name);
          }
        },
        error: (err: any) => {
          this.progressInfos[idx].value = 0;
          const msg = 'Could not upload the file: ' + file.name;
          this.message.push(msg);
        }});
    }
  }

  saveToDB(name){
    let ext = name.split('.');
    ext = ext[ext.length - 1];

    //images
    let obj = {
      owner_user: this.currentUser.id,
      owner_group: this.currentGroup.id,
      title: name,
      description: '',
      genre: 'default',
      extension: ext,
      tags: '',
      active: 1,
      views: 0
    };

    let location = '';
    if(this.imagesTypes.indexOf(ext) !== -1){
      location = 'image';
    }

    obj['location_url'] = name;

    if(this.imagesTypes.indexOf(ext) !== -1){
      obj['profile_url'] = '@' + this.currentGroup.name + '_image_' + name + '';
      this.imagesService.create(obj).subscribe((res) => {
        if(!res.message){
          this.alertService.success('Item has been created!', true);
        }else{
          this.alertService.error('Item failed to be created!', true);
        }
      });
    }

  }

}
