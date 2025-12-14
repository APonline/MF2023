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
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../../../services/authentication.service';
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';

/* services - make dynamic somehow later */
import { LibraryService } from 'src/app/services/library.service';
import { ArtistsService } from 'src/app/services/artists.service';
import { MFService } from 'src/app/services/MF.service';
import { LibraryUpdateComponent } from './library-update/library-update.component';
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

    // main image collection driving admin table + grid
    toolSet: any[] = [];
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

    allImages: any[] = [];
    allVideos: any[] = [];
    selectedGalleryIds: number[] = [];

    constructor(
        public dialog: MatDialog,
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private user: UserService,
        private alertService: AlertService,
        private libraryService: LibraryService,
        private artistsService: ArtistsService,
        private galleriesService: GalleriesService,
        private uploadService: FileUploadService,
        private snackBar: MatSnackBar,
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
                    this.selectedGalleryIds = [this.galleryFilterId];
                    this.selectedGallery =
                        this.galleries.find(g => g.id === this.galleryFilterId) || null;
                } else {
                    this.selectedGallery = null;
                    this.selectedGalleryIds = [];
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

        // legacy parent-driven CRUD – new flow uses internal CRUD methods
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

                this.libraryService.get(this.res.id).subscribe(u => {
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
                        .subscribe({
                            next: r => {
                                if (r && r.length && r[0].display) {
                                    newRes.preview = r[0].display;
                                } else {
                                    newRes.preview = u.location_url;
                                }

                                this.dataSource.push(newRes);
                                this.table.renderRows();
                            },
                            error: err => {
                                console.error(
                                    'Failed to hydrate preview for new legacy row',
                                    err,
                                    u
                                );
                                newRes.preview = u.location_url;
                                this.dataSource.push(newRes);
                                this.table.renderRows();
                            }
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

    // --------------------------------------------------------------------
    // Load library items once, then split into images/videos by extension
    // --------------------------------------------------------------------
    async loadData(): Promise<void> {
        this.libraryService.getAllForArtist(this.groupId).subscribe(result => {
            const rows = result.rows || result || [];

            // reset collections
            this.allImages = [];
            this.allVideos = [];
            this.images = [];
            this.videos = [];
            this.imageItems = [];
            this.videoItems = [];

            for (const res of rows) {
                // --- GALLERY TITLE NORMALIZATION ---
                if (res.gallery && res.gallery.title) {
                    res.gallery = res.gallery.title;
                }

                // --- EXTENSION NORMALISATION ---
                let ext = (res.extension || '').toString().toLowerCase();

                if (!ext && res.location_url) {
                    const parts = res.location_url.split('.');
                    ext = (parts[parts.length - 1] || '').toLowerCase();
                    res.extension = ext; // keep it on the object
                }

                // --- PREVIEW HYDRATION ---
                const loc = res.location_url || '';
                const group = this.artist?.id;

                if (!loc || !group) {
                    res.preview = loc;
                } else {
                    this.uploadService
                        .getFile(0, loc, 'artists/' + group, ext)
                        .subscribe({
                            next: r => {
                                res.preview =
                                    r && r.length && r[0].display
                                        ? r[0].display
                                        : loc;
                            },
                            error: () => {
                                res.preview = loc;
                            }
                        });
                }

                delete res.active;
                delete res.createdAt;
                delete res.updatedAt;

                // --- EXTENSION SORTING ---
                const imageExts = [
                    'jpg',
                    'jpeg',
                    'png',
                    'gif',
                    'tiff',
                    'svg',
                    'webp',
                    'bmp'
                ];
                const videoExts = ['mp4', 'mov', 'avi', 'mpeg', 'mkv', 'webm'];

                const isImage = imageExts.includes(ext);
                const isVideo = videoExts.includes(ext);

                if (isImage) {
                    this.allImages.push(res);
                } else if (isVideo) {
                    this.allVideos.push(res);
                } else {
                    // fallback for unknown/legacy: treat as image so it still shows up
                    this.allImages.push(res);
                }
            }

            // --- GALLERY FILTERING ---
            const galleryIds =
                this.selectedGalleryIds?.length
                    ? this.selectedGalleryIds
                    : this.galleryFilterId
                    ? [this.galleryFilterId]
                    : null;

            const filterByGallery = (arr: any[]) =>
                galleryIds
                    ? arr.filter(r => galleryIds.includes(r.owner_gallery))
                    : arr;

            this.images = filterByGallery(this.allImages);
            this.videos = filterByGallery(this.allVideos);

            this.imageItems = [...this.images];
            this.videoItems = [...this.videos];

            // admin table uses images by default
            this.toolSet = [...this.images];

            this.setSettings(this.toolSet);

            // deep-link handling
            this.handleMediaDeepLink();

            // auto-open first item if gallery deep-linked
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
    }

    /**
     * Apply gallery filter to images using selectedGalleryIds.
     * Empty array = all galleries.
     */
    private applyGalleryFilter(): void {
        const ids =
            this.selectedGalleryIds && this.selectedGalleryIds.length
                ? this.selectedGalleryIds
                : null;

        const filtered = ids
            ? this.allImages.filter(r => ids.includes(r.owner_gallery))
            : this.allImages;

        this.toolSet = [...filtered];
        this.images = [...filtered];
        this.imageItems = [...filtered];

        // refresh admin table datasource to match
        this.setSettings(this.toolSet);
    }

    onGalleryFilterChange(ids: number[]): void {
        this.selectedGalleryIds = ids || [];

        if (this.selectedGalleryIds.length === 1) {
            this.selectedGallery =
                this.galleries.find(g => g.id === this.selectedGalleryIds[0]) ||
                null;
        } else {
            // multiple / none selected → generic title
            this.selectedGallery = null;
        }

        this.applyGalleryFilter();
    }

    // 🔗 once images are present, open the deep-linked media item
    private handleMediaDeepLink(): void {
        if (
            this.deepLinkHandled ||
            !this.deepLinkMediaId ||
            !Array.isArray(this.toolSet)
        ) {
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
     * - call internal CRUD (create/update/archive)
     * - log artist activity with proper type (image/video)
     */
    openDialog(action: string, row: any): void {
        const isVideo = this.activeTab === 'videos';

        const data = this.MF.buildDialogCtx({
            action,
            toolName: isVideo ? 'Videos' : 'Images',
            artist: this.artist,
            currentUser: this.currentUser,
            seed: row
        });

        this.MF.openUpdateDialog<typeof data, { event: string; data: any }>(
            LibraryUpdateComponent,
            data
        ).subscribe(result => {
            if (!result) {
                return;
            }

            const base = result.data || {};
            const baseEvent = (result.event || '').toLowerCase();

            // Normalize event
            const isCreate = baseEvent === 'create' || baseEvent === 'add';
            const isDelete = baseEvent === 'delete' || baseEvent === 'archive';

            const title =
                (base.title ?? row?.title ?? '').toString().trim() ||
                (isVideo ? 'video' : 'image');
            const rawId = base.id ?? row?.id;

            const slug = this.buildMediaSlug(title);
            const provisionalProfileUrl = this.buildMediaDeepLink(rawId, slug);

            const cooked = this.MF.compose(base)
                .with({
                    id: rawId,
                    profile_url: provisionalProfileUrl,
                    owner_group: this.artist?.id,
                    owner_gallery: base.owner_gallery ?? row?.owner_gallery ?? null,
                    active: 1,
                    owner_user: this.currentUser.id,
                    views: isCreate ? 0 : base.views ?? row?.views ?? 0
                })
                .done();

            if (isDelete) {
                this.confirmArchive(cooked);
                return;
            }

            if (isCreate) {
                this.createMediaRecord(cooked, slug);
            } else {
                this.updateMediaRecord(cooked, slug);
            }
        });
    }

    /**
     * Choose the proper CRUD service based on activeTab.
     */
    private getMediaService(): LibraryService {
        return this.libraryService;
    }

    /**
     * Archive entry hook – right now we rely on the
     * snackbar-with-Undo inside archiveMediaRecord.
     * If you ever want a fancy custom dialog, wire it here.
     */
    private confirmArchive(media: any): void {
        this.archiveMediaRecord(media);
    }

    /**
     * CREATE
     */
    private createMediaRecord(cooked: any, slug: string): void {
        const svc = this.getMediaService();
        const isVideo = this.activeTab === 'videos';

        const payload = { ...cooked };
        delete payload.id; // backend will generate id

        svc.create(payload).subscribe({
            next: created => {
                console.log('[Media create] raw response:', created);
                const raw: any = created as any;

                const id =
                    raw.id ??
                    raw.data?.id ??
                    raw.data?.[0]?.id ??
                    raw.data?.rows?.[0]?.id ??
                    raw.insertId ??
                    (Array.isArray(raw) ? raw[0]?.id : undefined);

                if (!id) {
                    console.warn(
                        'Media create returned no id; leaving slug profile_url',
                        created
                    );

                    const finalMedia = {
                        ...(raw.data || raw),
                        profile_url: this.buildMediaDeepLink(undefined, slug)
                    };

                    this.hydratePreview(finalMedia);
                    this.finishCreateInCollections(finalMedia, isVideo);
                    this.logArtistActivity('create', finalMedia);

                    this.alertService.success(
                        isVideo ? 'Video item created.' : 'Image item created.',
                        true
                    );
                    return;
                }

                const profile_url = this.buildMediaDeepLink(id, slug);

                const finalMedia = {
                    ...(raw.data || raw),
                    id,
                    profile_url
                };

                // persist the deep link now that we know the id
                svc.update(id, { id, profile_url }).subscribe({
                    error: err =>
                        console.error(
                            'Failed to update media profile_url after create',
                            err
                        )
                });

                this.hydratePreview(finalMedia);
                this.finishCreateInCollections(finalMedia, isVideo);
                this.logArtistActivity('create', finalMedia);

                this.alertService.success(
                    isVideo ? 'Video item created.' : 'Image item created.',
                    true
                );
            },
            error: err => {
                console.error('Media create failed', err, cooked);
                this.alertService.error(
                    isVideo
                        ? 'Failed to create video item'
                        : 'Failed to create image item',
                    true
                );
            }
        });
    }

    /**
     * UPDATE
     */
    private updateMediaRecord(cooked: any, slug: string): void {
        const svc = this.getMediaService();
        const isVideo = this.activeTab === 'videos';

        if (!cooked.id) {
            console.warn('updateMediaRecord called without id', cooked);
            return;
        }

        const profile_url = this.buildMediaDeepLink(cooked.id, slug);
        const payload = { ...cooked, profile_url };

        svc.update(cooked.id, payload).subscribe({
            next: updated => {
                const finalMedia = { ...updated, profile_url };

                this.patchCollectionsWith(finalMedia);
                this.hydratePreview(finalMedia);
                this.logArtistActivity('update', finalMedia);

                this.alertService.success(
                    isVideo ? 'Video item updated.' : 'Image item updated.',
                    true
                );
            },
            error: err => {
                console.error('Media update failed', err, payload);
                this.alertService.error(
                    isVideo
                        ? 'Failed to update video item'
                        : 'Failed to update image item',
                    true
                );
            }
        });
    }

    /**
     * Archive a media row (soft delete = active: 0) with snackbar + Undo.
     */
    private archiveMediaRecord(media: any): void {
        if (!media?.id) {
            console.warn('archiveMediaRecord called with no id', media);
            return;
        }

        const svc = this.getMediaService();
        const isVideo = this.activeTab === 'videos';

        // Keep a copy so we can restore on Undo
        const archived = { ...media };

        svc.update(media.id, { active: 0 }).subscribe({
            next: () => {
                // Remove from in-memory collections
                if (isVideo) {
                    this.videos = (this.videos || []).filter(m => m.id !== media.id);
                    this.videoItems = (this.videoItems || []).filter(
                        m => m.id !== media.id
                    );
                } else {
                    this.toolSet = (this.toolSet || []).filter(m => m.id !== media.id);
                    this.images = (this.images || []).filter(m => m.id !== media.id);
                    this.imageItems = (this.imageItems || []).filter(
                        m => m.id !== media.id
                    );

                    if (Array.isArray(this.dataSource)) {
                        this.dataSource = this.dataSource.filter(
                            (m: any) => m.id !== media.id
                        );
                    }
                    this.table?.renderRows?.();
                }

                this.logArtistActivity('delete', archived);

                // 🔔 subtle snackbar with Undo
                const snackRef = this.snackBar.open(
                    isVideo ? 'Video archived' : 'Image archived',
                    'Undo',
                    {
                        duration: 5000,
                        horizontalPosition: 'right',
                        verticalPosition: 'bottom'
                    }
                );

                snackRef.onAction().subscribe(() => {
                    this.unarchiveMediaRecord(archived);
                });
            },
            error: err => {
                console.error('Archive failed', err);
                this.alertService.error(
                    isVideo ? 'Failed to archive video.' : 'Failed to archive image.',
                    true
                );
            }
        });
    }

    /**
     * Restore a previously archived media row (Undo from snackbar).
     */
    private unarchiveMediaRecord(media: any): void {
        const svc = this.getMediaService();
        const isVideo = this.activeTab === 'videos';

        svc.update(media.id, { active: 1 }).subscribe({
            next: () => {
                if (isVideo) {
                    this.videos = [...(this.videos || []), media];
                    this.videoItems = [...(this.videoItems || []), media];
                } else {
                    this.toolSet = [...(this.toolSet || []), media];
                    this.images = [...(this.images || []), media];
                    this.imageItems = [...(this.imageItems || []), media];

                    if (Array.isArray(this.dataSource)) {
                        this.dataSource = [...this.dataSource, media];
                    }
                    this.table?.renderRows?.();
                }
            },
            error: err => {
                console.error('Undo archive failed', err);
                this.alertService.error(
                    isVideo ? 'Failed to restore video.' : 'Failed to restore image.',
                    true
                );
            }
        });
    }

    /**
     * Hydrate .preview from file service (for both images + videos thumbnails)
     */
    private hydratePreview(media: any): void {
        const loc = media.location_url || '';
        if (!loc || !this.artist?.id) {
            return;
        }

        const parts = loc.split('.');
        const format = parts[parts.length - 1] || '';
        const group = this.artist.id;

        this.uploadService
            .getFile(0, loc, 'artists/' + group, format)
            .subscribe({
                next: r => {
                    if (r && r.length && r[0].display) {
                        media.preview = r[0].display;
                    } else {
                        media.preview = loc;
                    }
                },
                error: err => {
                    console.error('Failed to hydrate media preview', err, media);
                    media.preview = loc;
                }
            });
    }

    /**
     * Patch existing in-memory collections with updated media.
     */
    private patchCollectionsWith(media: any): void {
        const isVideo = this.activeTab === 'videos';

        const patchRow = (row: any) => {
            if (row.id === media.id) {
                Object.assign(row, media);
            }
        };

        if (isVideo) {
            (this.videos || []).forEach(patchRow);
            (this.videoItems || []).forEach(patchRow);
        } else {
            (this.toolSet || []).forEach(patchRow);
            (this.images || []).forEach(patchRow);
            (this.imageItems || []).forEach(patchRow);
            (this.dataSource || []).forEach(patchRow);
            this.table?.renderRows?.();
        }
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
            .replace(/[^\w\s-]/g, '') // strip symbols
            .replace(/\s+/g, '-') // spaces → dash
            .replace(/-+/g, '-'); // collapse dashes

        return `${handle}-${mediaSlug}`;
    }

    /**
     * Build the deep link used in profile_url:
     *   /projects/new-edit/<groupId>/<group>/library?mediaId=<id>&slug=<slug>
     * If we don't yet have an id (brand new record), we just return the slug.
     */
    private buildMediaDeepLink(
        id: number | string | undefined,
        slug: string
    ): string {
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

        const isVideo = this.activeTab === 'videos';
        const featureType = isVideo ? 'video' : 'image';

        let verbText = '';
        if (verb === 'create') verbText = 'created';
        else if (verb === 'update') verbText = 'updated';
        else verbText = 'archived';

        const actor = {
            id: this.currentUser?.id,
            username: this.currentUser?.username
        };

        const feature = {
            feature: featureType,
            extra: null
        };

        const label = `<b style="color:#ff4d4d">${media?.title || featureType}</b>`;
        const href = media?.profile_url || '';

        let activity: string;

        if (verb === 'delete' || !href) {
            activity = `${verbText} a ${featureType} ${label}`;
        } else {
            activity =
                `${verbText} a ${featureType} ` +
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

    /**
     * Helper to push a freshly-created media item into the appropriate collections.
     */
    private finishCreateInCollections(finalMedia: any, isVideo: boolean): void {
        // helper to compare rows
        const key = (row: any) => row?.id ?? row?.location_url;

        if (isVideo) {
            // VIDEOS
            const exists = (this.videos || []).some(m => key(m) === key(finalMedia));
            if (!exists) {
                this.videos = [...(this.videos || []), finalMedia];
            }

            const itemsExists = (this.videoItems || []).some(
                m => key(m) === key(finalMedia)
            );
            if (!itemsExists) {
                this.videoItems = [...(this.videos || [])];
            }
        } else {
            // IMAGES
            const alreadyInToolSet = (this.toolSet || []).some(
                m => key(m) === key(finalMedia)
            );
            if (!alreadyInToolSet) {
                this.toolSet = [...(this.toolSet || []), finalMedia];
            }

            const alreadyInImages = (this.images || []).some(
                m => key(m) === key(finalMedia)
            );
            if (!alreadyInImages) {
                this.images = [...(this.images || []), finalMedia];
            }

            // grid items
            const alreadyInItems = (this.imageItems || []).some(
                m => key(m) === key(finalMedia)
            );
            if (!alreadyInItems) {
                this.imageItems = [...(this.toolSet || [])];
            }

            // admin table datasource
            if (Array.isArray(this.dataSource)) {
                const alreadyInDs = this.dataSource.some(
                    (m: any) => key(m) === key(finalMedia)
                );
                if (!alreadyInDs) {
                    this.dataSource = [...this.dataSource, finalMedia];
                }
            }

            this.table?.renderRows?.();
        }
    }

    onOpenMedia(item: any): void {
        this.MF.openMediaPlayer(item);
    }

    onEditMedia(item: any, event: MouseEvent): void {
        event.stopPropagation(); // don't trigger viewer
        this.openDialog('Update', item);
    }

    onArchiveMedia(item: any, event: MouseEvent): void {
        event.stopPropagation(); // don't trigger viewer
        this.confirmArchive(item);
    }
}
