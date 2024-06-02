import { Component, Input, OnInit, Inject, Optional, ChangeDetectorRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { AlertService } from 'src/app/services/alert.service';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { FileUploadService } from 'src/app/services/file-upload.service';
import { ImagesService } from 'src/app/services/images.service';
import { DomSanitizer } from '@angular/platform-browser';
import { CropperComponent, ImageCropperResult } from 'angular-cropperjs';


@Component({
  selector: 'app-imageUpdate',
  templateUrl: './image-update.component.html',
  styleUrls: ['./image-update.component.scss'],
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

  selectedFiles = [];
  progressInfos: any[] = [];
  message: string[] = [];
  previews: string[] = [];
  fileInfos?: Observable<any>;

  imagesTypes = ['jpg','jpeg','JPG','png','gif','tiff','svg'];


  //tut
  @ViewChild('angularCropper') public angularCropper: CropperComponent;
  config = [];
  imageUrl = "";
  resultImage: any;
  resultResult: any;

  constructor(
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private router: Router,
      private alertService: AlertService,
      private uploadService: FileUploadService,
      private imagesService: ImagesService,
      private sanitizer: DomSanitizer,
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

    this.currentGroup = {name: this.local_data[0].name, id: this.local_data[0].id };

  }

  doAction(){
    this.dialogRef.close({event:this.action,data:this.local_data[0]});
  }

  closeDialog(){
    this.dialogRef.close({event:'Cancel'});
  }

  async ngOnInit() {
    await this.uploadService.getFile(0, this.data.profile_image, 'users/'+this.currentUser.id, 'png').subscribe(async res => {
      this.imageUrl = res[0].display;
      //this.selectedFiles = [this.dataURLtoFile(this.imageUrl,'profileimg.png')];

      await this.config.push({
        viewMode: 1,
        aspectRatio: NaN,
        preview: '#img-preview',
        zoomOnWheel: false,
        autoCropArea: 1,
        checkOrientation: false,
      });
    });
  }

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  updateUploadValue(e) {
    this.local_data[0][e.field] = e.val;
  }

  ///tut
  fileChangeEvent(event: any): void {
    let reader = new FileReader();

    reader.onload = (event: any) => {
      this.imageUrl = event.target.result;
    };

    reader.onerror = (event: any) => {
      console.log("File could not be read: " + event.target.error.code);
    };

    reader.readAsDataURL(event.target.files[0]);
    this.selectedFiles = [this.dataURLtoFile(this.imageUrl,'profileimg.png')];
    this.config.push({
      viewMode: 1,
      aspectRatio: NaN,
      preview: '#img-preview',
      zoomOnWheel: false,
      autoCropArea: 1,
      checkOrientation: false,
    });
  }

  CropMe() {
    this.resultResult = this.angularCropper.imageUrl;
    this.resultImage = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/png');

    this.angularCropper.exportCanvas();

    this.selectFiles(this.resultImage);
  }

  resultImageFun(event: ImageCropperResult) {
    let urlCreator = window.URL;
    this.resultResult = this.angularCropper.cropper.getCroppedCanvas().toDataURL('image/png');
  }

  checkstatus(event: any) {
    if (event.blob === undefined) {
      return;
    }
    // this.resultResult = event.blob;
    let urlCreator = window.URL;
    this.resultResult = this.sanitizer.bypassSecurityTrustUrl(
        urlCreator.createObjectURL(new Blob(event.blob)));
  }

  dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[arr.length - 1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  ////uploader
  selectFiles(f): void {
    this.message = [];
    this.progressInfos = [];

    this.selectedFiles = [this.dataURLtoFile(f,'profileimg.png')];

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

    if (this.selectedFiles.length > 0) {
      for (let i = 0; i < this.selectedFiles.length; i++) {
        this.upload(i, this.selectedFiles[i]);
      }
    }else {
      this.doAction();
    }
  }

  upload(idx: number, file: File): void {
    this.progressInfos[idx] = { value: 0, fileName: file.name };

    if (file) {
      let type = file.name.split('.').pop();
      let group = 'users/'+this.currentUser.id;
      this.uploadService.upload(file,group,type).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.progressInfos[idx].value = Math.round(100 * event.loaded / event.total);
          } else if (event instanceof HttpResponse) {
            const msg = 'Uploaded the file successfully: ' + file.name;
            this.message.push(msg);

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
          this.doAction();
          this.alertService.success('Profile Picture has been Updated!', true);
        }else{
          this.alertService.error('Pfoile Picture failed to Update!', true);
        }
      });
    }

  }

}
