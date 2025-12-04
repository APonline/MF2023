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
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';

/* services - make dynamic somehow later */
import { ArtistsService } from 'src/app/services/artists.service';
import { SocialsService } from 'src/app/services/socials.service';
import { ArtistsLinksService } from 'src/app/services/artist_links.service'; 

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

    adminForm = this.formBuilder.group({});

    startDate = new Date(2022, 0, 1);

    root = environment.root;
    artist: any;
    model = socials;

    // collections for the pretty view
    artistLinks: any[] = [];
    socialsList: any[] = [];

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
        private uploadService: FileUploadService,
        public MF: MFService
    ) {
        this.currentUser = this.authenticationService.currentUserValue;
    }

    ngOnInit() {
        this.imageKey = this.MF.buildImageKey(this.toolName);
        this.artistsService.get(this.groupId).subscribe(res => {
            this.artist = res;
        });
        this.loadData();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.imageKey = this.MF.buildImageKey(this.toolName);
        if (this.updateTable) {
            if (this.act == 'create') {
                Object.keys(this.res).map(res => {
                    if (
                        res == 'createdAt' ||
                        res == 'updatedAt' ||
                        res == 'active'
                    ) {
                        delete this.res[res];
                    }
                });

                this.dataSource.push(this.res);
            } else if (this.act == 'put') {
                this.dataSource = this.dataSource.filter((value, key) => {
                    if (value.id == this.res.id) {
                        this.displayedColumns.map(res => {
                            value[res] = this.res[res];
                        });
                    }
                    return true;
                });
            } else if (this.act == 'delete') {
                this.dataSource = this.dataSource.filter((value, key) => {
                    return value.id != this.res;
                });
            }
            this.table.renderRows();
        }
    }

    async loadData() {
        // SOCIAL ENGINES (via MF tool, usually "socials")
        this.MF.load(this.tool, { scope: 'allForArtist', artistId: this.groupId })
            .subscribe(result => {
                this[this.tool] = result.rows;
                this.toolSet = result.rows;

                this.socialsList = result.rows || [];

                this.setSettings(this.toolSet);
            });

        // ARTIST LINKS (simple URLs via artist-links API)
        this.artistsLinksService.getAllForArtist(this.groupId).subscribe(rows => {
            // your controller returns a plain array
            this.artistLinks = rows || [];
        });
    }

    setSettings(formData: any[]) {
        const { displayedColumns, formGroup, newRecord, rows } =
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

    validateAllFormFields(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            if (control instanceof FormControl) {
                control.markAsTouched({ onlySelf: true });
            } else if (control instanceof FormGroup) {
                this.validateAllFormFields(control);
            }
        });
    }

    // ----------------- SOCIAL ENGINES (using MF + SocialsUpdateComponent) -----------------

    openDialog(action: string, row: any) {
        const data = this.MF.buildDialogCtx({
            action,
            toolName: this.toolName,
            artist: this.artist,
            currentUser: this.currentUser,
            seed: row
        });

        this.MF
            .openUpdateDialog<typeof data, { event: string; data: any }>(
                SocialsUpdateComponent, // <-- use socials-specific update dialog
                data
            )
            .subscribe(result => {
                if (!result) return;

                const cooked = this.MF.compose(result.data)
                    .with({
                        profile_url: `${this.artist?.profile_url}-${(result.data?.title ?? '')
                            .toString()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '')
                            .toLowerCase()}`,
                        owner_group: this.artist?.id
                    })
                    .done();

                this.activeItem.emit({ action: result.event, data: cooked });
            });
    }

    openAddSocial() {
        // reuse MF newRecord seed
        this.openDialog('Add', this.newRecord);
    }

    editSocial(social: any) {
        this.openDialog('Update', social);
    }

    testPost(social: any) {
        console.log('Test post for', social);
        // later: call your API to do a dry-run / test content call
    }

    // ----------------- ARTIST LINKS (using LinksUpdateComponent directly) -----------------

    openAddLink() {
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

            const payload = {
                ...result.data,
                owner_user: this.currentUser.id,
                owner_group: this.artist?.id,
                active: 1
            };

            // create via artist-links API
            this.artistsLinksService.create(payload).subscribe(created => {
                this.artistLinks = [...this.artistLinks, created];
            });
        });
    }

    editLink(link: any) {
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
                });
                return;
            }

            if (result.event === 'Update' || result.event === 'Add') {
                const payload = {
                    ...result.data,
                    owner_user: this.currentUser.id,
                    owner_group: this.artist?.id,
                    active: 1
                };

                this.artistsLinksService.update(link.id, payload).subscribe(() => {
                    this.artistLinks = this.artistLinks.map(l =>
                        l.id === link.id ? { ...l, ...payload } : l
                    );
                });
            }
        });
    }

    // ---------- UI helpers for new view ----------

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
