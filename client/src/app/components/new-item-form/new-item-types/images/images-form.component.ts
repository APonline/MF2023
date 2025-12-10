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

@Component({
    selector: 'app-imagesForm',
    templateUrl: './images-form.component.html',
    styleUrls: ['./images-form.component.scss']
})
export class ImagesFormComponent implements OnInit, OnChanges {
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

    // 🔗 deep-link support: /images?galleryId=1
    private deepLinkGalleryId: number | null = null;
    selectedGallery: any = null;

    galleryFilterId: number | null = null;
    galleryFilterSlug: string | null = null;

    private firstMediaOpened = false;

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
        public MF: MFService
    ) {
        this.currentUser = this.authenticationService.currentUserValue;
    }

    // mf-nov7
    ngOnInit() {
        this.imageKey = this.MF.buildImageKey(this.toolName);

        // 1) read ?galleryId & ?slug from URL
        this.route.queryParamMap.subscribe(params => {
            const id = params.get('galleryId');
            this.galleryFilterId = id ? +id : null;
            this.galleryFilterSlug = params.get('slug');
        });

        // 2) load artist, then galleries + images
        this.artistsService.get(this.groupId).subscribe(artist => {
            this.artist = artist;

            this.galleriesService.getAllForArtist(this.artist.id).subscribe(res => {
                this.galleries = res;
            });

            this.loadData();
        });
    }


    ngOnChanges(changes: SimpleChanges): void {
        this.imageKey = this.MF.buildImageKey(this.toolName);

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

                this.imagesService.get(this.res.id).subscribe(async u => {
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

    // mf-nov7
    async loadData() {
        this.MF.load(this.tool, { scope: 'allForArtist', artistId: this.groupId })
            .subscribe(result => {
                const rows = result.rows || [];

                this.toolSet = this.galleryFilterId
                    ? rows.filter(r => r.owner_gallery === this.galleryFilterId)
                    : rows;

                this[this.tool] = this.toolSet;
                this.setSettings(this.toolSet);

                if (this.galleryFilterId && this.toolSet.length && !this.firstMediaOpened) {
                    this.firstMediaOpened = true;
                    this.MF.openMediaPlayer(this.toolSet[0]);
                }
            });
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

        // hydrate rows + previews
        for (const res of this.toolSet) {
            // gallery association is included as { gallery: { ... } }
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

        this.dataSource = new MatTableDataSource(this.toolSet);
        this.dataSource = this.dataSource.data;

        this.newRecord = newForm;
        this.adminForm = new FormGroup(form);
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

    // mf-nov7
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
                ImagesUpdateComponent,
                data
            )
            .subscribe(result => {
                if (!result) return;

                const cooked = this.MF
                    .compose(result.data)
                    .with({
                        profile_url: `${this.artist?.profile_url}-${(result.data?.title ?? '')
                            .toString()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '')
                            .toLowerCase()}`,
                        owner_group: this.artist?.id,
                        active: 1,
                        owner_user: this.currentUser.id
                    })
                    .done();

                this.activeItem.emit({ action: result.event, data: cooked });
            });
    }
}
