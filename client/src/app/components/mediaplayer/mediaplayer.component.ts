import { Component, Input, OnInit, Inject, Optional, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from  '../../services/authentication.service';
import {BACKSLASH, SLASH, COMMA, ENTER} from '@angular/cdk/keycodes';
import { BehaviorSubject, Observable } from 'rxjs';
import { AlertService } from 'src/app/services/alert.service';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import moment from 'moment';
import { ArtistsService } from 'src/app/services/artists.service';
import { UserService } from 'src/app/services/user.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { GalleriesService } from 'src/app/services/galleries.service';

@Component({
  selector: 'app-mediaplayer',
  templateUrl: 'mediaplayer.component.html',
  styleUrls: ['mediaplayer.component.scss']
 })
export class MediaplayerComponent implements OnInit {
  currentUser: any;

  loaded = false;
  mediaType = '';
  fileToDisplay = null;
  videoTypes = ['mov','mp4','avi','mpeg'];
  audioTypes = ['mp3','wav'];
  documentTypes = ['pdf','word','xlsx','csv','xls'];
  imagesTypes = ['jpg','jpeg','JPG','png','gif','tiff','svg'];


  constructor(
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private router: Router,
      private artistsService: ArtistsService,
      private userService: UserService,
      private galleriesService: GalleriesService,
      private uploadService: FileUploadService,
      private authenticationService: AuthenticationService,
      public dialogRef: MatDialogRef<MediaplayerComponent>,
      private cdr: ChangeDetectorRef,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.currentUser = this.authenticationService.currentUserValue;


  }

  closeDialog(){
    this.dialogRef.close({event:'Cancel'});
  }

  async ngOnInit() {
    if(this.videoTypes.indexOf(this.data.extension) >= 0){
      this.mediaType = 'video';

      this.fileToDisplay = this.uploadService.streamVideo(0, this.data.location_url, 'artists/'+this.data.owner_group, this.data.extension);
    }else if(this.audioTypes.indexOf(this.data.extension) >= 0){
      this.mediaType = 'music';
    }else if(this.documentTypes.indexOf(this.data.extension) >= 0){
      this.mediaType = 'document';
    }else if(this.imagesTypes.indexOf(this.data.extension) >= 0){
      this.mediaType = 'image';

      await this.uploadService.getFile(0, this.data.location_url, 'artists/'+this.data.owner_group, this.data.extension).subscribe(r => {
        console.log('HE: ',r)
        this.fileToDisplay = r[0].display;
        this.loaded = true;
      });
    }

  }


}

