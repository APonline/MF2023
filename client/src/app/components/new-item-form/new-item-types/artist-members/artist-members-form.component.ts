import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { MFService } from 'src/app/services/MF.service';
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserService } from 'src/app/services/user.service';
import { ArtistActivityService } from 'src/app/services/artist_activity.service';
import { ArtistMembersService } from 'src/app/services/artist_members.service';
import { ArtistsService } from 'src/app/services/artists.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { ArtistMembersUpdateComponent } from './artist-members-update/artist-members-update.component';

@Component({
    selector: 'app-artistMembersForm',
    templateUrl: './artist-members-form.component.html',
    styleUrls: ['./artist-members-form.component.scss']
})
export class ArtistMembersFormComponent implements OnInit, OnChanges {
    @Output() activeItem = new EventEmitter<any>();

    @Input() action: string;
    @Input() editUser: number;
    @Input() updateTable: boolean;
    @Input() res: any;
    @Input() act: 'create' | 'put' | 'delete';
    @Input() tool: string;
    @Input() toolName: string;
    @Input() group: string;
    @Input() groupId: string;

    @ViewChild(MatTable, { static: true }) table: MatTable<any>;

    currentUser: any;
    imageKey = '';

    displayedColumns: string[] = [];
    dataSource: any[] = null;
    newRecord: any = null;

    toolSet: any[] = [];
    modelSet: any;
    artist: any;

    adminForm = this.formBuilder.group({});
    root = environment.root;

    constructor(
        public dialog: MatDialog,
        private formBuilder: FormBuilder,
        private userService: UserService,
        private artistMembersService: ArtistMembersService,
        private artistActivityService: ArtistActivityService,
        private artistsService: ArtistsService,
        private authenticationService: AuthenticationService,
        private uploadService: FileUploadService,
        public MF: MFService
    ) {
        this.currentUser = this.authenticationService.currentUserValue;
    }

    ngOnInit() {
        this.imageKey = this.MF.buildImageKey(this.toolName);
        this.artistsService.get(this.groupId).subscribe(res => { this.artist = res; });
        this.loadData();
    }

    ngOnChanges(_: SimpleChanges) {
        this.imageKey = this.MF.buildImageKey(this.toolName);
        if (!this.updateTable) return;

        const enrichCreate$ = (payload: any) =>
            this.userService.get(payload.user_id).pipe(
                map(u => ({
                    id: payload.id,
                    user_id: u.id,
                    username: u.username,
                    name: `${u.first_name} ${u.last_name}`,
                    role: payload.role,
                    email: u.email,
                    phone: u.phone,
                    date_joined: payload.date_joined,
                    profile_url: u.profile_url,
                }))
            );

        const afterApply = ({ action, row }: { action: 'create' | 'put' | 'delete'; row: any }) => {
            const actor = { id: this.currentUser.id, username: this.currentUser.username };
            const feature = { feature: this.toolName.replace(/s$/i, ''), extra: null };
            const verb = action === 'put' ? 'update' : action; // your API expects 'update'
            this.artistActivityService
                .logMemberChange(verb, { type: 'user', item: row.username, link: row.profile_url }, {
                    actor, artistId: this.groupId, groupId: this.groupId, feature
                })
                .subscribe();
        };

        this.MF.applyTableChange(
            this.dataSource ?? [],
            this.act,
            this.res,
            {
                stripKeys: ['createdAt', 'updatedAt', 'active'],
                updateKeys: ['username', 'name', 'role', 'email', 'phone', 'date_joined', 'profile_url'],
                enrichCreate$,
                afterApply
            },
            () => this.table?.renderRows()
        ).then(next => this.dataSource = next);
    }

    loadData() {
        this.MF.load(this.tool, { scope: 'allForArtist', artistId: this.groupId })
            .subscribe(result => {
                this.modelSet = result.modelSet;
                this.toolSet = result.rows;
                this.dataSource = result.rows;

                if (this.toolSet.length > 0) {
                    // attach preview images
                    for (const row of this.toolSet) {
                        if (row.profile_image && row.profile_image !== 'default') {
                            const type = row.profile_image.split('.').pop();
                            this.uploadService.getFile(0, row.profile_image, 'users/' + row.user_id, type)
                                .subscribe(r => row.preview = r[0].display);
                        } else {
                            row.preview = './assets/images/defaultprofile1.png';
                        }
                    }

                    const scaffold = this.MF.buildTableScaffold(this.toolSet, [
                        'username', 'preview', 'name', 'role', 'email', 'phone', 'date_joined', 'profile_url'
                    ]);
                    this.displayedColumns = scaffold.displayedColumns;
                    this.adminForm = scaffold.adminForm;
                    this.newRecord = scaffold.newRecord;
                    this.dataSource = scaffold.dataSource;
                } else {
                    this.newRecord = this.MF.buildEmptyFromModel(this.modelSet);
                }
            });
    }

    validateAllFormFields(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            if (control instanceof FormControl) control.markAsTouched({ onlySelf: true });
            else if (control instanceof FormGroup) this.validateAllFormFields(control);
        });
    }

    openDialog(action: string, row: any) {
        const data = this.MF.buildDialogCtx({
            action,
            toolName: this.toolName,
            artist: this.artist,
            seed: row
        });

        this.MF.openUpdateDialog<typeof data, { event: string; data: any }>(
            ArtistMembersUpdateComponent,
            data
        ).subscribe(result => {
            if (!result) return;
            this.activeItem.emit({ action: result.event, data: result.data });
        });
    }
}
