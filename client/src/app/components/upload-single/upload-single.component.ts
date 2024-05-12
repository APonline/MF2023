import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileUploadService } from 'src/app/services/file-upload.service';

import { AlertService } from '../../services/alert.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
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

@Component({
  selector: 'app-upload-single',
  templateUrl: 'upload-single.component.html',
  styleUrls: ['./upload-single.component.scss']
})

export class UploadFileComponent implements OnInit {
  currentUser: any;
  currentGroup: any;
  @Input() service: string;
  @Input() file: string;
  @Input() group: string;
  @Input() field: string;
  @Output() fileNew = new EventEmitter<any>();

  selectedFiles?: FileList;
  progressInfos: any[] = [];
  message: string[] = [];
  previews: string[] = [];
  fileInfos?: Observable<any>;

  videoTypes = ['mov','mp4','avi','mpeg'];
  audioTypes = ['mp3','wav'];
  documentTypes = ['pdf','word','xlsx','csv','xls'];
  imagesTypes = ['jpg','jpeg','JPG','png','gif','tiff','svg'];

  constructor(
    private authenticationService: AuthenticationService,
    private uploadService: FileUploadService,
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
    private alertService: AlertService) {
      this.currentUser = this.authenticationService.currentUserValue;
      //this.currentGroup = this.authenticationService.currentUserValue;

      console.log(this.field, this.file, this.group)
    }

  ngOnInit(): void {
    this.currentGroup = this.group;

    // if(this.field == 'title'){
    //   console.log(this.file);
    // }

    let type = this.file.split(".").pop();

    this.fileInfos = this.uploadService.getFile(0, this.file, this.currentGroup.name.replace(/\s+/g, '-').toLowerCase(), type);

    // if(this.fileInfos){
    //   this.fileInfos.subscribe(res => {
    //     console.log("YOOO: ",res);
    //   });
    // }

  }

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
    if(this.videoTypes.indexOf(ext) !== -1){
      location = 'video';
      obj['duration'] = '';
    }
    if(this.audioTypes.indexOf(ext) !== -1){
      location = 'song';
      obj['duration'] = '';
      obj['owner_album'] = '';
      obj['author'] = '';
      obj['plays'] = '';
      delete obj['views'];
    }
    if(this.documentTypes.indexOf(ext) !== -1){
      location = 'document';
    }
    if(this.imagesTypes.indexOf(ext) !== -1){
      location = 'image';
    }

    obj['location_url'] = name;

    if(this.videoTypes.indexOf(ext) !== -1){
      obj['profile_url'] = '@' + this.currentGroup.name + '_video_' + name + '';
      this.videosService.create(obj).subscribe((res) => {
        if(!res.message){
          this.alertService.success('Item has been created!', true);
        }else{
          this.alertService.error('Item failed to be created!', true);
        }
      });
    }
    if(this.audioTypes.indexOf(ext) !== -1){
      obj['profile_url'] = '@' + this.currentGroup.name + '_song_' + name + '';
      this.songsService.create(obj).subscribe((res) => {
        if(!res.message){
          this.alertService.success('Item has been created!', true);
        }else{
          this.alertService.error('Item failed to be created!', true);
        }
      });
    }
    if(this.documentTypes.indexOf(ext) !== -1){
      obj['profile_url'] = '@' + this.currentGroup.name + '_document_' + name + '';
      this.documentsService.create(obj).subscribe((res) => {
        if(!res.message){
          this.alertService.success('Item has been created!', true);
        }else{
          this.alertService.error('Item failed to be created!', true);
        }
      });
    }
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
