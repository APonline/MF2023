import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileUploadService } from 'src/app/services/file-upload.service';

import { AlertService } from '../../services/alert.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { LibraryService } from 'src/app/services/library.service';
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
    @Input() group: any;              // usually { id, name }
    @Input() dir: string;             // e.g. 'artists'
    @Input() field: string;
    @Input() autoPersist: boolean = false; // set to FALSE for new Library flow

    @Output() fileNew = new EventEmitter<any>();

    selectedFiles?: FileList;
    progressInfos: any[] = [];
    message: string[] = [];
    previews: string[] = [];
    fileInfos?: Observable<any>;

    videoTypes = ['mov', 'mp4', 'avi', 'mpeg'];
    audioTypes = ['mp3', 'wav'];
    documentTypes = ['pdf', 'word', 'xlsx', 'csv', 'xls'];
    imagesTypes = ['jpg', 'jpeg', 'JPG', 'png', 'gif', 'tiff', 'svg'];

    constructor(
        private authenticationService: AuthenticationService,
        private uploadService: FileUploadService,
        private libraryService: LibraryService,
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
        private alertService: AlertService
    ) {
        this.currentUser = this.authenticationService.currentUserValue;
    }

    ngOnInit(): void {
        this.currentGroup = this.group;

        if (this.file && this.currentGroup?.id) {
            const type = this.file.split('.').pop();
            this.fileInfos = this.uploadService.getFile(
                0,
                this.file,
                `${this.dir}/${this.currentGroup.id}`,
                type
            );
        }
    }

    // ---------- filename sanitiser ----------
    private sanitizeFilename(name: string): string {
        if (!name) {
            return 'file';
        }

        const dotIdx = name.lastIndexOf('.');
        const rawBase = dotIdx !== -1 ? name.substring(0, dotIdx) : name;
        const rawExt = dotIdx !== -1 ? name.substring(dotIdx + 1) : '';

        // strip unicode weirdness, emojis, etc from base name
        let base = rawBase
            .normalize('NFKD')
            .replace(/[^\x00-\x7F]/g, '')       // remove non-ASCII characters (bye bye \u202F)
            .replace(/\s+/g, '-')               // spaces -> dash
            .replace(/[^a-zA-Z0-9_-]/g, '')     // only keep safe chars
            .replace(/-+/g, '-')                // collapse dashes
            .replace(/^[-_]+|[-_]+$/g, '');     // trim dashes/underscores

        if (!base) {
            base = 'file';
        }

        const ext = rawExt
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');         // very defensive – only letters/digits

        return ext ? `${base}.${ext}` : base;
    }

    // ---------- file input ----------
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

    // ---------- single upload ----------
    upload(idx: number, file: File): void {
        if (!file || !this.currentGroup?.id) {
            return;
        }

        // sanitize filename (kills the invisible narrow no-break space from Mac screenshots)
        const safeName = this.sanitizeFilename(file.name);

        // only wrap if the name actually changed (avoid extra allocations if not needed)
        const safeFile =
            safeName === file.name
                ? file
                : new File([file], safeName, { type: file.type });

        this.progressInfos[idx] = { value: 0, fileName: safeName };

        const type = safeName.split('.').pop();
        const groupId = this.currentGroup.id;
        const targetDir = `${this.dir}/${groupId}`;

        this.uploadService.upload(safeFile, targetDir, type).subscribe({
            next: (event: any) => {
                if (event.type === HttpEventType.UploadProgress) {
                    this.progressInfos[idx].value = Math.round(
                        (100 * event.loaded) / event.total
                    );
                } else if (event instanceof HttpResponse) {
                    const msg = 'Uploaded the file successfully: ' + safeName;
                    this.message.push(msg);

                    // hydrate file info / preview from backend helper
                    this.fileInfos = this.uploadService.getFile(
                        0,
                        safeName,
                        targetDir,
                        type
                    );

                    const obj = {
                        field: this.field,
                        val: safeName
                    };
                    this.fileNew.emit(obj);

                    if (this.autoPersist === true) {
                        this.saveToDB(safeName);
                    }
                }
            },
            error: (err: any) => {
                console.error('Upload failed', err);
                this.progressInfos[idx].value = 0;
                const msg = 'Could not upload the file: ' + safeName;
                this.message.push(msg);
            }
        });
    }

    // ---------- legacy autoPersist DB create ----------
    // NOTE: for the new Library flow, pass [autoPersist]="false" so this does NOT run.
    saveToDB(name: string): void {
        let ext: any = name.split('.');
        ext = ext[ext.length - 1];

        // images
        const obj: any = {
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
        if (this.videoTypes.indexOf(ext) !== -1) {
            location = 'video';
            obj['duration'] = '';
        }
        if (this.audioTypes.indexOf(ext) !== -1) {
            location = 'song';
            obj['duration'] = '';
            obj['owner_album'] = '';
            obj['author'] = '';
            obj['plays'] = '';
            delete obj['views'];
        }
        if (this.documentTypes.indexOf(ext) !== -1) {
            location = 'document';
        }
        if (this.imagesTypes.indexOf(ext) !== -1) {
            location = 'image';
        }

        obj['location_url'] = name;

        const handle =
            '@' +
            this.currentGroup.name
                .replace(/\s+/g, '')
                .toLowerCase();

        // if (this.videoTypes.indexOf(ext) !== -1) {
        //     obj['profile_url'] = `${handle}_video_${name}`;
        //     this.videosService.create(obj).subscribe(res => {
        //         if (!res.message) {
        //             this.alertService.success('Item has been created!', true);
        //         } else {
        //             this.alertService.error('Item failed to be created!', true);
        //         }
        //     });
        // }
        if (this.audioTypes.indexOf(ext) !== -1) {
            obj['profile_url'] = `${handle}_song_${name}`;
            this.songsService.create(obj).subscribe(res => {
                if (!res.message) {
                    this.alertService.success('Item has been created!', true);
                } else {
                    this.alertService.error('Item failed to be created!', true);
                }
            });
        }
        if (this.documentTypes.indexOf(ext) !== -1) {
            obj['profile_url'] = `${handle}_document_${name}`;
            this.documentsService.create(obj).subscribe(res => {
                if (!res.message) {
                    this.alertService.success('Item has been created!', true);
                } else {
                    this.alertService.error('Item failed to be created!', true);
                }
            });
        }
        // if (this.imagesTypes.indexOf(ext) !== -1) {
        //     obj['profile_url'] = `${handle}_image_${name}`;
        //     this.imagesService.create(obj).subscribe(res => {
        //         if (!res.message) {
        //             this.alertService.success('Item has been created!', true);
        //         } else {
        //             this.alertService.error('Item failed to be created!', true);
        //         }
        //     });
        // }
    }
}
