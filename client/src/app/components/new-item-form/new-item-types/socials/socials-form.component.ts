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
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';

/* services - make dynamic somehow later */
import { ArtistsService } from 'src/app/services/artists.service';
import { SocialsService } from 'src/app/services/socials.service';
import { ArtistsLinksService } from 'src/app/services/artist_links.service';
import { ArtistActivityService } from 'src/app/services/artist_activity.service';

import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { MatTableDataSource } from '@angular/material/table';
import { MFService } from 'src/app/services/MF.service';
import { socials } from 'src/app/models/socials.model';

import { SocialsUpdateComponent } from './socials-update/socials-update.component';
import { LinksUpdateComponent } from './links-update/links-update.component';

@Component({
    selector: 'app-socialsForm',
    templateUrl: './socials-form.component.html',
    styleUrls: ['./socials-form.component.scss']
})
export class SocialsFormComponent implements OnInit, OnChanges {
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
    @Input() tool: string;          // usually "socials"
    @Input() toolName: string;      // pretty label
    modeSubmit = 'Submit';
    delUser = false;
    projectTypeClicked = false;

    thisUser: '';
    toolSet: any = [];
    modelSet: any;
    @Input() group: string;         // route segment (e.g. "abysmalwhore")
    @Input() groupId: string;       // artist id

    adminForm: FormGroup = this.formBuilder.group({});

    startDate = new Date(2022, 0, 1);

    root = environment.root;
    artist: any;
    model = socials;

    // collections for the pretty view
    artistLinks: any[] = [];
    socialsList: any[] = [];

    // deep-link routing
    private deepLinkSlug: string | null = null;
    private deepLinkSocialId: number | null = null;
    private deepLinkLinkId: number | null = null;
    private deepLinkHandled = false;

    constructor(
        public dialog: MatDialog,
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private user: UserService,
        private router: Router,
        private DialogService: DialogService,
        private alertService: AlertService,
        private artistsService: ArtistsService,
        private socialsService: SocialsService,
        private artistsLinksService: ArtistsLinksService,
        private authenticationService: AuthenticationService,
        private artistActivityService: ArtistActivityService,
        private uploadService: FileUploadService,
        public MF: MFService
    ) {
        this.currentUser = this.authenticationService.currentUserValue;
    }

    ngOnInit(): void {
        this.imageKey = this.MF.buildImageKey(this.toolName);

        // grab ?slug=, ?socialId=, ?linkId= for deep links
        this.route.queryParamMap.subscribe(params => {
            const slug = params.get('slug');
            const socialId = params.get('socialId');
            const linkId = params.get('linkId');

            this.deepLinkSlug = slug || null;
            this.deepLinkSocialId = socialId ? +socialId : null;
            this.deepLinkLinkId = linkId ? +linkId : null;
        });

        this.artistsService.get(this.groupId).subscribe(res => {
            this.artist = res;
        });

        this.loadData();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.imageKey = this.MF.buildImageKey(this.toolName);

        if (this.updateTable) {
            if (this.act === 'create') {
                Object.keys(this.res).map(resKey => {
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
                this.dataSource = this.dataSource.filter((value) => {
                    if (value.id === this.res.id) {
                        this.displayedColumns.map(col => {
                            value[col] = this.res[col];
                        });
                    }
                    return true;
                });
            } else if (this.act === 'delete') {
                this.dataSource = this.dataSource.filter((value) => {
                    return value.id !== this.res;
                });
            }
            this.table.renderRows();
        }
    }

    async loadData(): Promise<void> {
        // SOCIAL ENGINES (via MF tool, usually "socials")
        this.MF.load(this.tool, { scope: 'allForArtist', artistId: this.groupId })
            .subscribe(result => {
                this[this.tool] = result.rows;
                this.toolSet = result.rows;

                this.socialsList = result.rows || [];

                this.setSettings(this.toolSet);

                // --- deep link handling for SOCIALS ---
                if (!this.deepLinkHandled && this.socialsList.length) {
                    let match: any = null;

                    if (this.deepLinkSocialId) {
                        match = this.socialsList.find(s => s.id === this.deepLinkSocialId);
                    } else if (this.deepLinkSlug) {
                        match = this.socialsList.find(s => {
                            const url = s.profile_url || '';
                            const slugPart = url.split('slug=').pop();
                            return slugPart === this.deepLinkSlug;
                        });
                    }

                    if (match) {
                        this.deepLinkHandled = true;
                        setTimeout(() => this.editSocial(match), 0);
                    }
                }
            });

        // ARTIST LINKS (simple URLs via artist-links API)
        this.artistsLinksService.getAllForArtist(this.groupId).subscribe(rows => {
            this.artistLinks = rows || [];

            // --- deep link handling for LINKS ---
            if (!this.deepLinkHandled && this.artistLinks.length) {
                let match: any = null;

                if (this.deepLinkLinkId) {
                    match = this.artistLinks.find(l => l.id === this.deepLinkLinkId);
                } else if (this.deepLinkSlug) {
                    match = this.artistLinks.find(l => {
                        const url = l.profile_url || '';
                        const slugPart = url.split('slug=').pop();
                        return slugPart === this.deepLinkSlug;
                    });
                }

                if (match) {
                    this.deepLinkHandled = true;
                    setTimeout(() => this.editLink(match), 0);
                }
            }
        });
    }

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
        this.dataSource = (this.dataSource as MatTableDataSource<any>).data;
    }

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

    /* ======================================================================
       SOCIAL ENGINES (SocialsService + SocialsUpdateComponent)
       ====================================================================== */

    openDialog(action: string, seed: any): void {
        const base = {
            action,
            tool: 'socials',
            group: this.toolName,
            owner_id: this.artist?.id,
            ...seed
        };

        const dialogRef = this.dialog.open(SocialsUpdateComponent, {
            width: '560px',
            data: base
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result || result.event === 'Cancel') return;

            if (result.event === 'delete') {
                // DELETE / ARCHIVE
                const id = seed.id;
                if (!id) return;

                this.socialsService.delete(id).subscribe(() => {
                    this.socialsList = this.socialsList.filter(s => s.id !== id);
                    this.logSocialActivity('delete', seed);
                });

                return;
            }

            // CREATE or UPDATE
            const raw = result.data || {};
            const payload: any = {
                ...raw,
                owner_user: this.currentUser.id,
                owner_group: this.artist?.id,
                active: 1
            };

            if (action === 'Add' || !seed.id) {
                // CREATE – first create, then build deep link using returned row (with id)
                this.socialsService.create(payload).subscribe(created => {
                    const row = { ...created };

                    row.profile_url = this.MF.buildProfileSlug(
                        this.artist,
                        this.group,
                        row,
                        {
                            featurePath: 'socials',
                            idParam: 'socialId',
                            labelKeys: ['title', 'platform', 'username']
                        }
                    );

                    if (row.id) {
                        this.socialsService.update(row.id, { profile_url: row.profile_url }).subscribe();
                    }

                    this.socialsList = [...this.socialsList, row];
                    this.logSocialActivity('create', row);
                });
            } else {
                // UPDATE
                const id = seed.id;
                const updatedRow = { ...seed, ...payload };

                updatedRow.profile_url = this.MF.buildProfileSlug(
                    this.artist,
                    this.group,
                    updatedRow,
                    {
                        featurePath: 'socials',
                        idParam: 'socialId',
                        labelKeys: ['title', 'platform', 'username']
                    }
                );

                this.socialsService.update(id, updatedRow).subscribe(() => {
                    this.socialsList = this.socialsList.map(s =>
                        s.id === id ? updatedRow : s
                    );
                    this.logSocialActivity('put', updatedRow);
                });
            }
        });
    }

    openAddSocial(): void {
        // reuse MF newRecord seed
        this.openDialog('Add', this.newRecord);
    }

    editSocial(social: any): void {
        this.openDialog('Update', social);
    }

    testPost(social: any): void {
        console.log('Test post for', social);
        // later: call your API to do a dry-run / test content call
    }

    /* ======================================================================
       ARTIST LINKS (LinksUpdateComponent + ArtistsLinksService)
       ====================================================================== */

    openAddLink(): void {
        const base = {
            action: 'Add',
            tool: 'artist-links',
            group: this.toolName,
            owner_id: this.artist?.id,
            id: '',
            title: '',
            url: '',
            description: '',
            profile_url: '',
            active: 1
        };

        const dialogRef = this.dialog.open(LinksUpdateComponent, {
            width: '520px',
            data: base
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result || result.event === 'Cancel') return;

            const payload: any = {
                ...result.data,
                owner_user: this.currentUser.id,
                owner_group: this.artist?.id,
                active: 1
            };

            // 1) CREATE first so we get the real DB id
            this.artistsLinksService.create(payload).subscribe(created => {
                const row: any = { ...created };

                // 2) Build deep link with ?linkId= and slug
                row.profile_url = this.MF.buildProfileSlug(
                    this.artist,
                    this.group,
                    row,
                    {
                        featurePath: 'socials',          // lives on the socials page
                        idParam: 'linkId',               // ?linkId=123
                        labelKeys: ['title', 'url']      // slug from title/url
                    }
                );

                // 3) Patch profile_url back to server
                if (row.id) {
                    this.artistsLinksService
                        .update(row.id, { profile_url: row.profile_url })
                        .subscribe();
                }

                // 4) Update local list + activity
                this.artistLinks = [...this.artistLinks, row];
                this.logLinkActivity('create', row);
            });
        });
    }

    editLink(link: any): void {
        const data = {
            action: 'Update',
            tool: 'artist-links',
            group: this.toolName,
            owner_id: this.artist?.id,
            ...link
        };

        const dialogRef = this.dialog.open(LinksUpdateComponent, {
            width: '520px',
            data
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result) return;

            if (result.event === 'delete') {
                // DELETE
                this.artistsLinksService.delete(link.id).subscribe(() => {
                    this.artistLinks = this.artistLinks.filter(l => l.id !== link.id);
                    this.logLinkActivity('delete', link);
                });
                return;
            }

            if (result.event === 'Update' || result.event === 'Add') {
                const payload: any = {
                    ...result.data,
                    owner_user: this.currentUser.id,
                    owner_group: this.artist?.id,
                    active: 1
                };

                const updatedRow: any = { ...link, ...payload };

                updatedRow.profile_url = this.MF.buildProfileSlug(
                    this.artist,
                    this.group,
                    updatedRow,
                    {
                        featurePath: 'socials',
                        idParam: 'linkId',
                        labelKeys: ['title', 'url']
                    }
                );

                this.artistsLinksService.update(link.id, updatedRow).subscribe(() => {
                    this.artistLinks = this.artistLinks.map(l =>
                        l.id === link.id ? updatedRow : l
                    );
                    this.logLinkActivity('put', updatedRow);
                });
            }
        });
    }

    /* ======================================================================
       ACTIVITY LOGGING
       ====================================================================== */

    private logLinkActivity(
        action: 'create' | 'put' | 'delete',
        row: any
    ): void {
        const actor = {
            id: this.currentUser.id,
            username: this.currentUser.username
        };

        const feature = {
            feature: 'link',
            extra: null
        };

        const verb: 'create' | 'update' | 'delete' =
            action === 'put' ? 'update' : action;

        let verbText = '';
        if (verb === 'create')      verbText = 'created';
        else if (verb === 'update') verbText = 'updated';
        else if (verb === 'delete') verbText = 'removed';

        const labelText = row.title || row.url || 'link';
        const label = `<b>${labelText}</b>`;

        let activity: string;

        if (verb === 'delete' || !row.profile_url) {
            activity = `${verbText} a link ${label}`;
        } else {
            activity =
                `${verbText} a link ` +
                `<a href="${row.profile_url}">` +
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
            .subscribe();
    }

    private logSocialActivity(
        action: 'create' | 'put' | 'delete',
        row: any
    ): void {
        const actor = {
            id: this.currentUser.id,
            username: this.currentUser.username
        };

        const feature = {
            feature: 'social',
            extra: null
        };

        const verb: 'create' | 'update' | 'delete' =
            action === 'put' ? 'update' : action;

        let verbText = '';
        if (verb === 'create')      verbText = 'connected';
        else if (verb === 'update') verbText = 'updated';
        else if (verb === 'delete') verbText = 'disconnected';

        const labelText = row.title || row.platform || row.username || 'social engine';
        const label = `<b>${labelText}</b>`;

        let activity: string;

        if (verb === 'delete' || !row.profile_url) {
            activity = `${verbText} a social engine ${label}`;
        } else {
            activity =
                `${verbText} a social engine ` +
                `<a href="${row.profile_url}">` +
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
            .subscribe();
    }

    /* ======================================================================
       UI HELPERS
       ====================================================================== */

    getLinkEmoji(link: any): string {
        const t = (link?.title || '').toLowerCase();
        const u = (link?.url || '').toLowerCase();

        if (t.includes('website') || u.includes('.com')) return '🌐';
        if (u.includes('facebook') || t.includes('facebook')) return '📘';
        if (u.includes('instagram')) return '📸';
        if (u.includes('youtube')) return '▶️';
        if (u.includes('spotify')) return '🎧';
        if (u.includes('bandcamp')) return '🛒';
        return '🔗';
    }

    getPlatformEmoji(platform: string): string {
        const p = (platform || '').toLowerCase();
        switch (p) {
            case 'facebook':
                return '📘';
            case 'instagram':
                return '📸';
            case 'youtube':
                return '▶️';
            case 'tiktok':
                return '🎵';
            case 'x':
                return '✖️';
            case 'spotify':
                return '🎧';
            default:
                return '🔌';
        }
    }
}
