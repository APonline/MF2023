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
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../../../services/authentication.service';
import { BehaviorSubject, catchError, Observable, of } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import moment from 'moment';

/* services - make dynamic somehow later */
import { ImagesService } from 'src/app/services/images.service';
import { ArtistsService } from 'src/app/services/artists.service';
import { VidoesService } from 'src/app/services/videos.service';
import { GalleriesService } from 'src/app/services/galleries.service';

import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { MatTableDataSource } from '@angular/material/table';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { MFService } from 'src/app/services/MF.service';
import { GalleriesUpdateComponent } from './galleries-update/galleries-update.component';
import { galleries } from 'src/app/models/galleries.model';
import { ArtistActivityService } from 'src/app/services/artist_activity.service';

@Component({
    selector: 'app-galleriesForm',
    templateUrl: './galleries-form.component.html',
    styleUrls: ['./galleries-form.component.scss']
})
export class GalleriesFormComponent implements OnInit, OnChanges {
    @Output() activeItem = new EventEmitter<any>();

    currentUser: any;
    imageKey = '';
    @Input() action: string;
    @Input() editUser: number;

    displayedColumns: string[] = [];
    dataSource: any = null;
    newRecord: any = null;
    gallerySearch: string = '';

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
    model = galleries;

    // 🔗 deep-link handling
    private deepLinkGalleryId: number | null = null;
    private deepLinkHandled = false;

    private galleryCoverCache: { [galleryId: number]: string } = {};
    private galleryCoverLoading: { [galleryId: number]: boolean } = {};

    constructor(
        public dialog: MatDialog,
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private user: UserService,
        private router: Router,
        private DialogService: DialogService,
        private imagesService: ImagesService,
        private artistsService: ArtistsService,
        private galleriesService: GalleriesService,
        private videosService: VidoesService,
        private authenticationService: AuthenticationService,
        private uploadService: FileUploadService,
        public MF: MFService,
        private artistActivityService: ArtistActivityService
    ) {
        this.currentUser = this.authenticationService.currentUserValue;
    }

    // mf-nov7
    ngOnInit(): void {
        this.imageKey = this.MF.buildImageKey(this.toolName);

        // grab ?galleryId=<id> for deep links
        this.route.queryParamMap.subscribe(params => {
            const id = params.get('galleryId');
            this.deepLinkGalleryId = id ? +id : null;
        });

        // once artist is loaded, load galleries
        this.artistsService.get(this.groupId).subscribe(res => {
            this.artist = res;
            this.loadData();
        });
    }

    // mf-nov7
    ngOnChanges(changes: SimpleChanges): void {
        this.imageKey = this.MF.buildImageKey(this.toolName);

        // avoid calling into table before it exists
        if (!this.updateTable || !this.dataSource) {
            return;
        }

        if (this.act === 'create') {
            Object.keys(this.res || {}).forEach(resKey => {
                if (
                    resKey === 'createdAt' ||
                    resKey === 'updatedAt' ||
                    resKey === 'active'
                ) {
                    delete this.res[resKey];
                }
            });

            this.dataSource.push(this.res);
        } else if (this.act === 'put') {
            this.dataSource = this.dataSource.filter((value: any) => {
                if (value.id === this.res.id) {
                    this.displayedColumns.forEach(col => {
                        value[col] = this.res[col];
                    });
                }
                return true;
            });
        } else if (this.act === 'delete') {
            this.dataSource = this.dataSource.filter(
                (value: any) => value.id !== this.res
            );
        }

        if (this.table) {
            this.table.renderRows();
        }
    }

    // mf-nov7
    async loadData(): Promise<void> {
        let toolTitle: any = this.tool.split('_');
        toolTitle = this.MF.capitalizeWords(toolTitle);

        let toolTitle2 = toolTitle.join(',');
        toolTitle2 = toolTitle2.replace(/ /g, '');
        toolTitle2 = toolTitle2.replace(/,/g, '');
        toolTitle2 = toolTitle2.charAt(0).toLowerCase() + toolTitle2.slice(1);
        const service = toolTitle2 + 'Service';

        await this[service].getAllForArtist(this.groupId).subscribe((res: any) => {
            this[this.tool] = res;
            this.toolSet = this[this.tool];

            this.setSettings(this.toolSet);
            this.handleGalleryDeepLink();   // 👈 once galleries are here, check deep link
        });
    }

    // 🔗 find the deep-linked gallery and open the modal once
    private handleGalleryDeepLink(): void {
        if (this.deepLinkHandled || !this.deepLinkGalleryId || !Array.isArray(this.toolSet)) {
            return;
        }

        const match = this.toolSet.find((g: any) => g.id === this.deepLinkGalleryId);
        if (!match) {
            return;
        }

        this.deepLinkHandled = true;
        // slight delay so view is stable before opening dialog
        setTimeout(() => this.openDialog('Update', match), 0);
    }

    // mf-nov7
    setSettings(formData: any[]): void {
        const { displayedColumns, formGroup, newRecord } =
            this.MF.buildFromData(formData?.length ? formData : this.toolSet, {
                exclude: ['active', 'createdAt', 'updatedAt'],
                includeAction: true,
                pinnedOrder: ['id', 'title'],
                modelKeys: this.model.keys(),
                mutateRows: true
            });

        this.displayedColumns = displayedColumns;
        this.adminForm = formGroup;
        this.newRecord = newRecord;
        this.dataSource = new MatTableDataSource(this.toolSet);
        this.dataSource = this.dataSource.data;
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
     * Open create/update dialog for a gallery
     * - rebuild slug + /projects deep link on every save
     * - emit cooked record
     * - on updates, persist profile_url directly
     * - log artist activity
     */
    openDialog(action: string, row: any): void {
        const data = this.MF.buildDialogCtx({
            action,
            toolName: this.toolName,
            artist: this.artist,
            currentUser: this.currentUser,
            seed: row
        });

        this.MF
            .openUpdateDialog<typeof data, { event: string; data: any }>(
                GalleriesUpdateComponent,
                data
            )
            .subscribe(result => {
                if (!result) {
                    return;
                }

                const base = result.data || {};
                const baseEvent = (result.event || '').toLowerCase();
                const isCreate =
                    baseEvent === 'create' || baseEvent === 'add';

                // use dialog title, else existing row title
                const title =
                    (base.title ?? row?.title ?? '').toString().trim() || 'gallery';

                // id if we already have one (updates only – creates will be slug-only for now)
                const rawId = base.id ?? row?.id;

                // build slug like "@dronewolf-random-stuffy-n-things"
                const slug = this.buildGallerySlug(title);

                // build /projects deep link when we know the id, otherwise just use slug
                const profile_url = this.buildGalleryDeepLink(rawId, slug);

                const cooked = this.MF
                    .compose(base)
                    .with({
                        id: rawId,
                        profile_url,
                        owner_group: this.artist?.id,
                        views: isCreate
                            ? 0
                            : (base.views ?? row?.views ?? 0)
                    })
                    .done();

                // for updates, push the new profile_url into DB right away
                if (!isCreate && cooked.id) {
                    this.galleriesService
                        .update(cooked.id, {
                            id: cooked.id,
                            profile_url
                        })
                        .subscribe({
                            error: err =>
                                console.error('Failed to update gallery profile_url', err)
                        });
                }

                // parent handles create/put/delete persisting via activeItem
                this.activeItem.emit({ action: result.event, data: cooked });

                // activity log with fresh deep link
                this.logArtistActivity(result.event, cooked);
            });
    }

    /**
     * Build handle + title slug, e.g.
     *   handle: "@dronewolf"
     *   title:  "Random stuffy n things"
     * → "@dronewolf-random-stuffy-n-things"
     */
    private buildGallerySlug(title: string): string {
        const handle =
            (this.artist?.profile_url || `@${this.group || 'artist'}`)
                .toString()
                .trim();

        const gallerySlug = title
            .toString()
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')   // strip symbols
            .replace(/\s+/g, '-')        // spaces → dash
            .replace(/-+/g, '-');        // collapse dashes

        return `${handle}-${gallerySlug}`;
    }

    /**
     * Build the deep link used in profile_url:
     *   /projects/new-edit/<groupId>/<group>/<featurePath>?galleryId=<id>&slug=<slug>
     * If we don't yet have an id (brand new record), we just return the slug.
     */
    private buildGalleryDeepLink(id: number | string | undefined, slug: string): string {
        if (!id) {
            return slug; // for brand-new records, until ID exists
        }

        const featurePath = (this.toolName || 'galleries').toLowerCase();

        return (
            `/projects/new-edit/${this.groupId}/${this.group}/${featurePath}` +
            `?galleryId=${id}&slug=${slug}`
        );
    }

    /**
     * Log what happened into the artist activity log (like tasks board).
     */
    private logArtistActivity(event: string, gallery: any): void {
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
            feature: this.toolName?.replace(/s$/i, '') || 'gallery',
            extra: null
        };

        const label = `<b style="color:#ff4d4d">${gallery?.title || 'gallery'}</b>`;
        const href = gallery?.profile_url || '';

        let activity: string;

        if (verb === 'delete' || !href) {
            activity = `${verbText} a gallery ${label}`;
        } else {
            activity =
                `${verbText} a gallery ` +
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
                    console.error('[ArtistActivityLog] gallery log failed', err, {
                        activity,
                        actor,
                        feature,
                        gallery
                    });
                }
            });
    }

    galleryMatchesSearch(g: any, term: string): boolean {
        if (!term) return true;
        const t = term.toLowerCase();
        return (
            (g.title || '').toLowerCase().includes(t) ||
            (g.description || '').toLowerCase().includes(t) ||
            (g.tags || '').toLowerCase().includes(t) ||
            (g.genre || '').toLowerCase().includes(t)
        );
    }

    // cover image helper – plug into your universal uploader later
    // cover image helper – pull first image in the gallery if available
        // cover image helper – now pulls first image in that gallery
    getGalleryCover(g: any): string {
        if (!g || !g.id) {
            return '/assets/images/Gigs.jpg';
        }

        const id = g.id;

        // already loaded → use it
        if (this.galleryCoverCache[id]) {
            return this.galleryCoverCache[id];
        }

        // temporary fallback while we fetch
        this.galleryCoverCache[id] = '/assets/images/Gigs.jpg';

        this.imagesService.getFirstForGallery(id).subscribe({
            next: img => {
                if (img && img.preview) {
                    this.galleryCoverCache[id] = img.preview; // data:image/... from server
                }
            },
            error: err => {
                console.error('Failed to load gallery cover', err);
            }
        });

        return this.galleryCoverCache[id];
    }

    // open a gallery into the dialog + update the deep-link
    // open a gallery into the Images feature, filtered by this gallery
    openGallery(g: any): void {
        if (!g) {
            return;
        }

        const title = (g.title || 'gallery').toString().trim();
        const slug = this.buildGallerySlug(title);  // already defined helper

        this.router.navigate(
            ['/projects/new-edit', this.groupId, this.group, 'images'],
            {
                queryParams: {
                    galleryId: g.id,
                    slug
                }
            }
        );
    }



    splitTags(tags: string | null | undefined): string[] {
        if (!tags) return [];
        return tags
            .split(',')
            .map(t => t.trim())
            .filter(t => !!t);
    }
}
