import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';

/* services - make dynamic somehow later */
import { ImagesService } from 'src/app/services/images.service';
import { ArtistsService } from 'src/app/services/artists.service';

import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { MatTableDataSource } from '@angular/material/table';
import { MFService } from 'src/app/services/MF.service';
import { ImagesUpdateComponent } from './images-update/images-update.component';
import { GalleriesService } from 'src/app/services/galleries.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { ArtistActivityService } from 'src/app/services/artist_activity.service';

@Component({
    selector: 'app-libraryForm',
    templateUrl: './library-form.component.html',
    styleUrls: ['./library-form.component.scss']
})
export class LibraryFormComponent implements OnInit, OnChanges {
    @Output() activeItem = new EventEmitter<any>();

    currentUser: any;
    imageKey = '';
    @Input() action: string;
    @Input() editUser: number;

    displayedColumns: string[] = [];
    dataSource: any = null;
    newRecord: any = null;

    @ViewChild(MatTable, { static: true }) table: MatTable<any>;

    @Input() updateTable: boolean;
    @Input() res: any;
    @Input() act: any;

    dataReady = false;
    @Input() tool: string;
    @Input() toolName: string;
    modeSubmit = 'Submit';
    delUser = false;
    projectTypeClicked = false;

    thisUser: '';
    toolSet: any = [];
    modelSet: any;
    @Input() group: string;
    @Input() groupId: string;

    adminForm: FormGroup = this.formBuilder.group({});

    startDate = new Date(2022, 0, 1);

    root = environment.root;
    artist: any;
    galleries: any[] = [];
    selectedGallery: any = null;

    // 🔗 deep-link support: /library?galleryId=XX&mediaId=YY
    galleryFilterId: number | null = null;
    galleryFilterSlug: string | null = null;

    private deepLinkMediaId: number | null = null;
    private deepLinkHandled = false;

    private firstMediaOpened = false;

    activeTab: 'images' | 'videos' = 'images';

    images: any[] = [];
    videos: any[] = [];

    imageItems: any[] = [];
    videoItems: any[] = [];

    constructor(
        public dialog: MatDialog,
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private user: UserService,
        private router: Router,
        private DialogService: DialogService,
        private alertService: AlertService,
        private imagesService: ImagesService,
        private artistsService: ArtistsService,
        private galleriesService: GalleriesService,
        private uploadService: FileUploadService,
        private authenticationService: AuthenticationService,
        public MF: MFService,
        private artistActivityService: ArtistActivityService
    ) {
        this.currentUser = this.authenticationService.currentUserValue;
        this.tool = 'Images';
        this.toolName = 'Library';
    }

    // mf-nov7
    ngOnInit(): void {
        this.tool = 'Images';
        this.imageKey = this.MF.buildImageKey('Library');

        // 1) read ?galleryId, ?mediaId & ?slug from URL
        this.route.queryParamMap.subscribe(params => {
            const galleryId = params.get('galleryId');
            this.galleryFilterId = galleryId ? +galleryId : null;
            this.galleryFilterSlug = params.get('slug');

            const mediaId = params.get('mediaId');
            this.deepLinkMediaId = mediaId ? +mediaId : null;
        });

        // 2) load artist, then galleries + media
        this.artistsService.get(this.groupId).subscribe(artist => {
            this.artist = artist;

            this.galleriesService.getAllForArtist(this.artist.id).subscribe(res => {
                this.galleries = res || [];

                if (this.galleryFilterId) {
                    this.selectedGallery =
                        this.galleries.find(g => g.id === this.galleryFilterId) || null;
                } else {
                    this.selectedGallery = null;
                }
            });


            this.loadData();
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.imageKey = this.MF.buildImageKey('Library');

        if (!this.updateTable || !this.dataSource) {
            return;
        }

        if (this.act === 'create') {
            Object.keys(this.res || {}).forEach(k => {
                if (k === 'createdAt' || k === 'updatedAt' || k === 'active') {
                    delete this.res[k];
                }
            });

            // refresh galleries in case a new one got used
            this.galleriesService.getAllForArtist(this.groupId).subscribe(gals => {
                this.galleries = gals || [];

                const galleryRow = this.galleries.find(
                    r => r.id === this.res.owner_gallery
                );

                this.imagesService.get(this.res.id).subscribe(u => {
                    const newRes: any = {
                        id: u.id,
                        owner_id: u.owner_id,
                        owner_group: u.owner_group,
                        owner_gallery: u.owner_gallery,
                        gallery: galleryRow ? galleryRow.title : '',
                        title: u.title,
                        preview: '',
                        description: u.description,
                        genre: u.genre,
                        tags: u.tags,
                        views: u.views,
                        profile_url: u.profile_url,
                        location_url: u.location_url
                    };

                    const typeParts = u.location_url.split('.');
                    const format = typeParts[typeParts.length - 1];
                    const group = this.artist?.id;

                    this.uploadService
                        .getFile(0, u.location_url, 'artists/' + group, format)
                        .subscribe(r => {
                            newRes.preview = r[0].display;

                            this.dataSource.push(newRes);
                            this.table.renderRows();
                        });
                });
            });
        } else if (this.act === 'put') {
            this.dataSource = this.dataSource.filter((value: any) => {
                if (value.id === this.res.id) {
                    this.displayedColumns.forEach(col => {
                        value[col] = this.res[col];
                    });
                }
                return true;
            });
            this.table.renderRows();
        } else if (this.act === 'delete') {
            this.dataSource = this.dataSource.filter(
                (value: any) => value.id !== this.res
            );
            this.table.renderRows();
        }
    }

    // mf-nov7 – load images (table + grid) and videos (grid only)
    async loadData(): Promise<void> {
        // --- 1) IMAGES: still drive the table + image tab ---
        this.MF.load('Images', { scope: 'allForArtist', artistId: this.groupId })
            .subscribe(result => {
                const rows = result.rows || [];

                const filtered = this.galleryFilterId
                    ? rows.filter(r => r.owner_gallery === this.galleryFilterId)
                    : rows;

                this.toolSet = filtered;
                this.images = filtered;
                this.imageItems = filtered;

                // hydrate rows + previews for the admin table & grid
                for (const res of this.toolSet) {
                    if (res.gallery && res.gallery.title) {
                        res.gallery = res.gallery.title;
                    }

                    const typeParts = res.location_url.split('.');
                    const format = typeParts[typeParts.length - 1];
                    const group = this.artist?.id;

                    this.uploadService
                        .getFile(0, res.location_url, 'artists/' + group, format)
                        .subscribe(r => {
                            res.preview = r[0].display;
                        });

                    delete res.active;
                    delete res.createdAt;
                    delete res.updatedAt;
                }

                this.setSettings(this.toolSet);

                // deep-link to a specific media item if requested
                this.handleMediaDeepLink();

                // otherwise, if we came from a gallery deep-link, open first media
                if (
                    !this.deepLinkHandled &&
                    this.galleryFilterId &&
                    this.toolSet.length &&
                    !this.firstMediaOpened
                ) {
                    this.firstMediaOpened = true;
                    this.MF.openMediaPlayer(this.toolSet[0]);
                }
            });

        // --- 2) VIDEOS: view-only grid for now ---
        this.MF.load('Videos', { scope: 'allForArtist', artistId: this.groupId })
            .subscribe(result => {
                const rows = result.rows || [];

                const filtered = this.galleryFilterId
                    ? rows.filter(r => r.owner_gallery === this.galleryFilterId)
                    : rows;

                for (const res of filtered) {
                    if (res.gallery && res.gallery.title) {
                        res.gallery = res.gallery.title;
                    }

                    const typeParts = res.location_url.split('.');
                    const format = typeParts[typeParts.length - 1];
                    const group = this.artist?.id;

                    this.uploadService
                        .getFile(0, res.location_url, 'artists/' + group, format)
                        .subscribe(r => {
                            res.preview = r[0].display;
                        });

                    delete res.active;
                    delete res.createdAt;
                    delete res.updatedAt;
                }

                this.videos = filtered;
                this.videoItems = filtered;
            });
    }

    // 🔗 once images are present, open the deep-linked media item
    private handleMediaDeepLink(): void {
        if (this.deepLinkHandled || !this.deepLinkMediaId || !Array.isArray(this.toolSet)) {
            return;
        }

        const match = this.toolSet.find((m: any) => m.id === this.deepLinkMediaId);
        if (!match) {
            return;
        }

        this.deepLinkHandled = true;
        setTimeout(() => this.MF.openMediaPlayer(match), 0);
    }

    private async setSettings(formData: any[]): Promise<void> {
        const form: any = {};
        const newForm: any = {};

        this.displayedColumns = []; // reset in case of reload

        this.displayedColumns.push('action');
        form['action'] = new FormControl('');
        newForm['action'] = '';

        this.displayedColumns.push('id');
        form['id'] = new FormControl('');
        newForm['id'] = '';

        this.displayedColumns.push('owner_user');
        form['owner_user'] = new FormControl('');
        newForm['owner_user'] = '';

        this.displayedColumns.push('owner_group');
        form['owner_group'] = new FormControl('');
        newForm['owner_group'] = '';

        this.displayedColumns.push('owner_gallery');
        form['owner_gallery'] = new FormControl('');
        newForm['owner_gallery'] = '';

        this.displayedColumns.push('gallery');
        form['gallery'] = new FormControl('');
        newForm['gallery'] = '';

        this.displayedColumns.push('title');
        form['title'] = new FormControl('');
        newForm['title'] = '';

        this.displayedColumns.push('preview');
        form['preview'] = new FormControl('');
        newForm['preview'] = '';

        this.displayedColumns.push('description');
        form['description'] = new FormControl('');
        newForm['description'] = '';

        this.displayedColumns.push('genre');
        form['genre'] = new FormControl('');
        newForm['genre'] = '';

        this.displayedColumns.push('extension');
        form['extension'] = new FormControl('');
        newForm['extension'] = '';

        this.displayedColumns.push('tags');
        form['tags'] = new FormControl('');
        newForm['tags'] = '';

        this.displayedColumns.push('views');
        form['views'] = new FormControl('');
        newForm['views'] = '';

        this.displayedColumns.push('profile_url');
        form['profile_url'] = new FormControl('');
        newForm['profile_url'] = '';

        this.displayedColumns.push('location_url');
        form['location_url'] = new FormControl('');
        newForm['location_url'] = '';

        this.dataSource = new MatTableDataSource(this.toolSet);
        this.dataSource = this.dataSource.data;

        this.newRecord = newForm;
        this.adminForm = new FormGroup(form);
    }

    setActiveTab(tab: 'images' | 'videos'): void {
        this.activeTab = tab;
    }

    // mf-nov7
    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            if (control instanceof FormControl) {
                control.markAsTouched({ onlySelf: true });
            } else if (control instanceof FormGroup) {
                this.validateAllFormFields(control);
            }
        });
    }

    /**
     * Open create/update dialog for a media item
     * - rebuild slug + /projects deep link on every save
     * - emit cooked record
     * - on updates, persist profile_url directly
     * - log artist activity
     */
    openDialog(action: string, row: any): void {
        const data = this.MF.buildDialogCtx({
            action,
            toolName: 'Images',
            artist: this.artist,
            currentUser: this.currentUser,
            seed: row
        });

        this.MF
            .openUpdateDialog<typeof data, { event: string; data: any }>(
                ImagesUpdateComponent,
                data
            )
            .subscribe(result => {
                if (!result) {
                    return;
                }

                const base = result.data || {};
                const baseEvent = (result.event || '').toLowerCase();
                const isCreate = baseEvent === 'create' || baseEvent === 'add';

                const title =
                    (base.title ?? row?.title ?? '').toString().trim() || 'image';

                const rawId = base.id ?? row?.id;

                const slug = this.buildMediaSlug(title);
                const profile_url = this.buildMediaDeepLink(rawId, slug);

                const cooked = this.MF
                    .compose(base)
                    .with({
                        id: rawId,
                        profile_url,
                        owner_group: this.artist?.id,
                        owner_gallery: base.owner_gallery ?? row?.owner_gallery ?? null,
                        active: 1,
                        owner_user: this.currentUser.id,
                        views: isCreate
                            ? 0
                            : (base.views ?? row?.views ?? 0)
                    })
                    .done();

                // for updates, push the new profile_url into DB right away
                if (!isCreate && cooked.id) {
                    this.imagesService
                        .update(cooked.id, {
                            id: cooked.id,
                            profile_url
                        })
                        .subscribe({
                            error: err =>
                                console.error('Failed to update media profile_url', err)
                        });
                }

                // parent handles create/put/delete persisting via activeItem
                this.activeItem.emit({ action: result.event, data: cooked });

                // activity log with fresh deep link
                this.logArtistActivity(result.event, cooked);
            });
    }

    /**
     * Build handle + title slug:
     *   handle: "@dronewolf"
     *   title:  "Album Art"
     * → "@dronewolf-album-art"
     */
    private buildMediaSlug(title: string): string {
        const handle =
            (this.artist?.profile_url || `@${this.group || 'artist'}`)
                .toString()
                .trim();

        const mediaSlug = title
            .toString()
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')   // strip symbols
            .replace(/\s+/g, '-')        // spaces → dash
            .replace(/-+/g, '-');        // collapse dashes

        return `${handle}-${mediaSlug}`;
    }

    /**
     * Build the deep link used in profile_url:
     *   /projects/new-edit/<groupId>/<group>/library?mediaId=<id>&slug=<slug>
     * If we don't yet have an id (brand new record), we just return the slug.
     */
    private buildMediaDeepLink(id: number | string | undefined, slug: string): string {
        if (!id) {
            return slug; // for brand-new records, until ID exists
        }

        const featurePath = 'library';

        return (
            `/projects/new-edit/${this.groupId}/${this.group}/${featurePath}` +
            `?mediaId=${id}&slug=${slug}`
        );
    }

    /**
     * Log what happened into the artist activity log (like tasks board).
     */
    private logArtistActivity(event: string, media: any): void {
        const baseEvent = (event || '').toLowerCase();
        let verb: 'create' | 'update' | 'delete';

        if (baseEvent === 'create' || baseEvent === 'add') {
            verb = 'create';
        } else if (baseEvent === 'delete' || baseEvent === 'archive') {
            verb = 'delete';
        } else {
            verb = 'update';
        }

        let verbText = '';
        if (verb === 'create')      verbText = 'created';
        else if (verb === 'update') verbText = 'updated';
        else                        verbText = 'archived';

        const actor = {
            id: this.currentUser?.id,
            username: this.currentUser?.username
        };

        const feature = {
            feature: 'image',
            extra: null
        };

        const label = `<b style="color:#ff4d4d">${media?.title || 'image'}</b>`;
        const href = media?.profile_url || '';

        let activity: string;

        if (verb === 'delete' || !href) {
            activity = `${verbText} an image ${label}`;
        } else {
            activity =
                `${verbText} an image ` +
                `<a href="${href}">` +
                `${label}` +
                `</a>`;
        }

        this.artistActivityService
            .logChange(activity, {
                actor,
                artistId: this.groupId,
                groupId: this.groupId,
                feature
            })
            .subscribe({
                next: () => {},
                error: err => {
                    console.error('[ArtistActivityLog] media log failed', err, {
                        activity,
                        actor,
                        feature,
                        media
                    });
                }
            });
    }
}
