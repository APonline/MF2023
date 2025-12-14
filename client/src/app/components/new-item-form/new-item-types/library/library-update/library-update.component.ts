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
import { GalleriesService } from 'src/app/services/galleries.service';

@Component({
  selector: 'app-libraryUpdate',
  templateUrl: './library-update.component.html',
  styleUrls: ['./library-update.component.scss']
 })
export class LibraryUpdateComponent implements OnInit {
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
    title: ['', Validators.required],
    description: [''],
    gallery: [''],
    genre: [''],
    tags: [''],
  });
  secondFormGroup = this.formBuilder.group({
    profile_image: [''],
    profile_banner_image: [''],
  });

  selectedTags = '';
  selectedGenres: string[] = [];
  galleries = [];
  selectedGallery = '';

  // same options as gallery type
  galleryGenreOptions = [
      { value: 'live',          label: 'Live Show' },
      { value: 'promo',         label: 'Promo Photos' },
      { value: 'bts',           label: 'Behind the Scenes' },
      { value: 'studio',        label: 'Studio Session' },
      { value: 'rehearsal',     label: 'Rehearsal' },
      { value: 'tour',          label: 'Tour / On the Road' },
      { value: 'merch',         label: 'Merch / Products' },
      { value: 'artwork',       label: 'Artwork / Concepts' },
      { value: 'coverConcept',  label: 'Cover Concepts' },
      { value: 'presskit',      label: 'Press / Media Kit' }
  ];


  constructor(
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private router: Router,
      private artistsService: ArtistsService,
      private userService: UserService,
      private galleriesService: GalleriesService,
      private uploadService: FileUploadService,
      private authenticationService: AuthenticationService,
      public dialogRef: MatDialogRef<LibraryUpdateComponent>,
      private cdr: ChangeDetectorRef,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
    console.log("DATA:: ",data, data.tool);

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

    // hydrate selectedGenres from existing record, if any
    const rawGenre = (this.local_data[0].genre || '').toString();
    if (rawGenre) {
        this.selectedGenres = rawGenre
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
    }

    this.currentGroup = {name: this.local_data[0].groupName, id: this.local_data[0].groupId };

    this.galleriesService
    .getAllForArtist(this.local_data[0].groupId)
    .subscribe(res => {
        this.galleries = res || [];

        // only try to pre-select if we actually have an owner_gallery value
        if (this.local_data[0].owner_gallery) {
            const match = this.galleries.find(
                g => g.id === this.local_data[0].owner_gallery
            );
            this.selectedGallery = match ? match.id : null;
        } else {
            this.selectedGallery = null;
        }
    });


    if(data.id != ''){
      this.modUser = true;
    }else{
      this.modUser = false;
      this.local_data[0].owner_gallery = 0;
    }

    this.requiresUploader();

  }

  get f() { return this.firstFormGroup.controls; }


  doAction(){
    //image
    if(this.local_data[0].location_url != 'default' && this.local_data[0].location_url != ''){
      let group = this.data.groupId;
      let type = this.local_data[0].location_url.split('.');
      let format = type[type.length - 1];
       this.uploadService.getFile(0, this.local_data[0].location_url, 'artists/'+group, format).subscribe(r => {
        this.local_data[0]['location_url_img'] = r[0].display;
      });
    }else{
      this.local_data[0]['location_url_img'] = './assets/images/intrologo.png';
    }
    let type = this.local_data[0].location_url.split('.');
    let ext = type[type.length - 1];
    let galtitle = this.galleries.filter(r => r.id == this.local_data[0].owner_gallery)[0];

    let newEdits = {
      id: this.local_data[0].id,
      title: this.local_data[0].title,
      extension: ext,
      user_owner: this.currentUser.id,
      owner_gallery: this.local_data[0].owner_gallery,
      description: this.local_data[0].description,
      genre: this.local_data[0].genre,
      tags: this.local_data[0].tags,
      views: 0,
      location_url: this.local_data[0].location_url,
      active: 1,
      gallery: galtitle.title
    };

    console.log('data: ',newEdits)

    this.dialogRef.close({event:this.action,data:newEdits});
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

    if (e.field === 'location_url') {
        const group  = this.data.groupId;
        const parts  = (this.local_data[0].location_url || '').split('.');
        const format = parts[parts.length - 1] || '';

        this.uploadService
            .getFile(0, this.local_data[0].location_url, 'artists/' + group, format)
            .subscribe({
                next: (r) => {
                    if (r && r.length && r[0].display) {
                        this.local_data[0]['location_url_img'] = r[0].display;
                    } else {
                        // fall back to raw path so the field isn’t undefined
                        this.local_data[0]['location_url_img'] =
                            this.local_data[0].location_url;
                    }
                },
                error: () => {
                    this.local_data[0]['location_url_img'] =
                        this.local_data[0].location_url;
                }
            });
    }
  }

  getTag(e) {
    this.local_data[0]['tags'] = e
    this.selectedTags = this.local_data[0]['tags'];
  }

  onChangeGallery(g){
    this.selectedGallery = this.galleries.find(x => x.id == g).title;
    this.local_data[0].owner_gallery = g;
  }

  onGenresChange(values: string[]): void {
    this.selectedGenres = values || [];
    // store compact codes in the record; comma-separated string
    this.local_data[0].genre = this.selectedGenres.join(',');
  }

  getGenreLabel(val: string): string {
      const found = this.galleryGenreOptions.find(g => g.value === val);
      return found ? found.label : val;
  }

  getGenresSummary(): string {
      if (!this.selectedGenres || !this.selectedGenres.length) {
          return this.local_data[0].genre ? this.local_data[0].genre : '—';
      }
      return this.selectedGenres.map(v => this.getGenreLabel(v)).join(', ');
  }



}
