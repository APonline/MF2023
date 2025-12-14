import {
    Component,
    Input,
    OnInit,
    Inject,
    Optional,
    ChangeDetectorRef
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    Validators
} from '@angular/forms';
import { AuthenticationService } from '../../../../../services/authentication.service';
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
    newRecord: any = null;
    ownerFound = false;
    userList: any[] = [];

    displayedColumns: string[] = [];

    action: string;
    tool: string;
    local_data: any;
    currentGroup: any = null;

    uploaderNeeds = ['image', 'video', 'document', 'song'];
    uploaderInstalled = false;

    // stepper
    isLinear = true;
    isValid = false;
    modUser = false;
    submitted = false;

    firstFormGroup = this.formBuilder.group({
        title: ['', Validators.required],
        description: [''],
        gallery: [null],
        genre: [''],
        tags: ['']
    });

    secondFormGroup = this.formBuilder.group({
        profile_image: [''],
        profile_banner_image: ['']
    });

    selectedTags = '';
    selectedGenres: string[] = [];

    galleries: any[] = [];
    /** store id + title separately so we never flip types */
    selectedGalleryId: number | null = null;
    selectedGalleryTitle = '';

    // same options as gallery type
    galleryGenreOptions = [
        { value: 'live', label: 'Live Show' },
        { value: 'promo', label: 'Promo Photos' },
        { value: 'bts', label: 'Behind the Scenes' },
        { value: 'studio', label: 'Studio Session' },
        { value: 'rehearsal', label: 'Rehearsal' },
        { value: 'tour', label: 'Tour / On the Road' },
        { value: 'merch', label: 'Merch / Products' },
        { value: 'artwork', label: 'Artwork / Concepts' },
        { value: 'coverConcept', label: 'Cover Concepts' },
        { value: 'presskit', label: 'Press / Media Kit' }
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

        this.action = data.action;

        // normalise tool: "Images" → "image"
        if (data.tool.substring(data.tool.length - 1) === 's') {
            data.tool = data.tool.slice(0, -1);
        }
        this.tool = `${data.tool}`;
        delete data.tool;

        data.owner_user = this.currentUser.id;
        data.active = 1;

        Object.keys(data).forEach(key => {
            this.displayedColumns.push(key);
        });

        this.local_data = [{ ...data }];

        const row = this.local_data[0];

        // if caller already set it, keep it
        if (!row.location_url_img) {
            if (row.preview) {
                // use hydrated preview from library grid
                row.location_url_img = row.preview;
            } else if (row.location_url && row.location_url !== 'default') {
                const group = this.data.groupId;
                const parts = (row.location_url as string).split('.');
                const format = parts[parts.length - 1] || '';

                this.uploadService
                    .getFile(0, row.location_url, 'artists/' + group, format)
                    .subscribe({
                        next: r => {
                            if (r && r.length && r[0].display) {
                                row.location_url_img = r[0].display;
                            } else {
                                row.location_url_img = row.location_url;
                            }
                            this.cdr.markForCheck();
                        },
                        error: () => {
                            row.location_url_img = row.location_url;
                            this.cdr.markForCheck();
                        }
                    });
            }
        }

        // genres
        const rawGenre = (this.local_data[0].genre || '').toString();
        if (rawGenre) {
            this.selectedGenres = rawGenre
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
        }

        this.currentGroup = {
            name: this.local_data[0].groupName,
            id: this.local_data[0].groupId
        };

        // fetch galleries and preselect if editing
        this.galleriesService
            .getAllForArtist(this.local_data[0].groupId)
            .subscribe(res => {
                this.galleries = res || [];

                const existingGalleryId =
                    this.local_data[0].owner_gallery || null;

                if (existingGalleryId) {
                    this.selectedGalleryId = existingGalleryId;
                    this.selectedGalleryTitle = this.getGalleryTitle(
                        existingGalleryId
                    );
                    this.firstFormGroup.patchValue({
                        gallery: existingGalleryId
                    });
                } else {
                    this.selectedGalleryId = null;
                    this.selectedGalleryTitle = '';
                    this.firstFormGroup.patchValue({ gallery: null });
                }
            });

        if (data.id !== '') {
            this.modUser = true;
        } else {
            this.modUser = false;
            this.local_data[0].owner_gallery = 0;
        }

        this.requiresUploader();
    }

    get f() {
        return this.firstFormGroup.controls;
    }

    ngOnInit(): void {}

    requiresUploader(): boolean {
        if (this.uploaderNeeds.indexOf(this.tool) !== -1) {
            this.uploaderInstalled = true;
            return true;
        }
        return false;
    }

    ngAfterContentChecked(): void {
        this.cdr.detectChanges();
    }

    /**
     * Confirm & close dialog
     */
    doAction(): void {
        // hydrate preview (image/video thumb)
        if (
            this.local_data[0].location_url !== 'default' &&
            this.local_data[0].location_url
        ) {
            const group = this.data.groupId;
            const typeParts = this.local_data[0].location_url.split('.');
            const format = typeParts[typeParts.length - 1];

            this.uploadService
                .getFile(
                    0,
                    this.local_data[0].location_url,
                    'artists/' + group,
                    format
                )
                .subscribe(r => {
                    this.local_data[0]['location_url_img'] =
                        r && r.length ? r[0].display : this.local_data[0].location_url;
                });
        } else {
            this.local_data[0]['location_url_img'] =
                './assets/images/intrologo.png';
        }

        const typeParts = this.local_data[0].location_url.split('.');
        const ext = typeParts[typeParts.length - 1];

        const galleryTitle = this.getGalleryTitle(
            this.local_data[0].owner_gallery
        );

        const newEdits = {
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
            gallery: galleryTitle
        };

        this.dialogRef.close({ event: this.action, data: newEdits });
    }

    closeDialog(): void {
        this.dialogRef.close({ event: 'Cancel' });
    }

    updateUploadValue(e: any): void {
        this.local_data[0][e.field] = e.val;

        if (e.field === 'location_url') {
            const group = this.data.groupId;
            const parts = (this.local_data[0].location_url || '').split('.');
            const format = parts[parts.length - 1] || '';

            this.uploadService
                .getFile(
                    0,
                    this.local_data[0].location_url,
                    'artists/' + group,
                    format
                )
                .subscribe({
                    next: r => {
                        if (r && r.length && r[0].display) {
                            this.local_data[0]['location_url_img'] = r[0].display;
                        } else {
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

    getTag(e: string): void {
        this.local_data[0]['tags'] = e;
        this.selectedTags = this.local_data[0]['tags'];
    }

    /**
     * When user picks a gallery from the select.
     * Single source of truth = id on the form + local_data[0].owner_gallery.
     */
    onChangeGallery(id: number): void {
        this.selectedGalleryId = id;
        this.local_data[0].owner_gallery = id;
        this.selectedGalleryTitle = this.getGalleryTitle(id);
        this.firstFormGroup.patchValue({ gallery: id });
    }

    onGenresChange(values: string[]): void {
        this.selectedGenres = values || [];
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
        return this.selectedGenres
            .map(v => this.getGenreLabel(v))
            .join(', ');
    }

    getGalleryTitle(id: number | null | undefined): string {
        if (!id) {
            return '';
        }
        const match = this.galleries.find(g => g.id === id);
        return match ? match.title : '';
    }
}
