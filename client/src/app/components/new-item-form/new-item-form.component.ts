import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import moment from 'moment';
import { NewItemUpdateComponent } from '../new-item-update/new-item-update.component';

/* services - make dynamic somehow later */
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

import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { MatTableDataSource } from '@angular/material/table';
import { GalleriesService } from 'src/app/services/galleries.service';

import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-newItemForm',
    templateUrl: './new-item-form.component.html',
    styleUrls: ['./new-item-form.component.scss']
})
export class NewItemFormComponent implements OnInit {
    public currentUser: Observable<any>;
    @Input() action: string;
    @Input() editUser: number;

    displayedColumns: string[] = [];
    dataSource: any = null;
    newRecord: any = null;

    @ViewChild(MatTable, { static: true }) table: MatTable<any>;

    dataReady = false;
    tool = '';
    toolName = '';
    modeSubmit = 'Submit';
    delUser = false;
    projectTypeClicked = false;

    thisUser: '';
    toolSet: any = [];
    modelSet: any;
    group: string | null = null;      // e.g. "abysmalwhore" (no @)
    groupId: string | null = null;    // e.g. "12"
    updateTable = false;
    res: any;
    act: string;

    adminForm: FormGroup = this.formBuilder.group({});

    startDate = new Date(2022, 0, 1);

    root = environment.root;

    constructor(
        public dialog: MatDialog,
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private user: UserService,
        private router: Router,
        private DialogService: DialogService,
        private alertService: AlertService,
        private galleriesService: GalleriesService,
        private imagesService: ImagesService,
        private albumsService: AlbumsService,
        private artistLinksService: ArtistsLinksService,
        private artistMembersService: ArtistMembersService,
        private artistService: ArtistsService,
        private commentsService: CommentsService,
        private contactsService: ContactsService,
        private documentsService: DocumentsService,
        private friendsService: FriendsService,
        private gigsService: GigsService,
        private socialsService: SocialsService,
        private songsService: SongsService,
        private videosService: VidoesService,
        private authenticationService: AuthenticationService
    ) {
        // this.currentUser = this.authenticationService.currentUserValue;
    }

    ngOnInit(): void {
        // const rawUrl = this.router.url;          // "/projects/new-edit/12/abysmalwhore/tasks?taskId=11&slug=..."
        // const [pathOnly] = rawUrl.split('?');    // "/projects/new-edit/12/abysmalwhore/tasks"

        // const parts = pathOnly.split('/').filter(Boolean);

        // const projectId = parts[2] || null;
        // const group = parts[3] || null;
        // const tool = parts[4] || null;

        // this.groupId = projectId;
        // this.group = group ? group.replace(/_/g, ' ').replace(/@/g, '') : null;

        // this.tool = tool || '';
        // this.toolName = this.tool.replace(/_/g, ' ');

        // this.loadData();
        // Initial parse of the current URL
        this.applyUrl(this.router.url);

        // Watch for future navigation changes (same component reused)
        this.router.events
            .pipe(filter(e => e instanceof NavigationEnd))
            .subscribe((e: NavigationEnd) => {
                this.applyUrl(e.urlAfterRedirects);
            });
    }

    private applyUrl(url: string): void {
        const [pathOnly] = url.split('?');
        const parts = pathOnly.split('/').filter(Boolean);

        const projectId = parts[2] || null;
        const group     = parts[3] || null;
        const tool      = parts[4] || null;

        this.groupId = projectId;
        this.group = group ? group.replace(/_/g, ' ').replace(/@/g, '') : null;
        this.tool = tool || '';
        this.toolName = this.tool.replace(/_/g, ' ');

        // Reset table-update flag on navigation change
        this.updateTable = false;
    }


    capitalizeWords(arr: string[]): string[] {
        return arr.map(word => {
            const capitalizedFirst = word.charAt(0).toUpperCase();
            const rest = word.slice(1).toLowerCase();
            return capitalizedFirst + rest;
        });
    }

    async loadData(): Promise<void> {
        let toolTitle: any = this.tool.split('_');
        toolTitle = this.capitalizeWords(toolTitle);

        let toolTitle2 = toolTitle.join(',');
        toolTitle2 = toolTitle2.replace(/ /g, '');
        toolTitle2 = toolTitle2.replace(/,/g, '');
        toolTitle2 = toolTitle2.charAt(0).toLowerCase() + toolTitle2.slice(1);
        const service = toolTitle2 + 'Service';
        const model = this.tool;

        // you were not actually using service/model here,
        // leaving as-is in case you wire it up later
    }

    takeAction(obj: any): void {
        if (!obj) {
            return;
        }

        if (obj.action === 'Add') {
            this.createNew(obj.data);
        } else if (obj.action === 'Update') {
            this.update(obj.data);
        } else if (obj.action === 'Delete') {
            this.delete(obj.data.id);
        }
    }

    // CREATE
    createNew(data: any): void {
        delete data.id;
        delete data.action;

        let tName: string | null = null;
        if (this.tool.indexOf('_') !== -1) {
            const t = this.tool.split('_');
            tName = t[0] + t[1].charAt(0).toUpperCase() + t[1].slice(1);
        } else {
            tName = this.tool;
        }

        const service = tName + 'Service';

        this[service].create(data).subscribe(async (res: any) => {
            this.act = 'create';
            this.res = res;
            this.updateTable = true;
            this.alertService.success('Item has been created!', true);
        });
    }

    // UPDATE
    update(data: any): void {
        const id = data.id;
        delete data.action;

        let tName: string | null = null;
        if (this.tool.indexOf('_') !== -1) {
            const t = this.tool.split('_');
            tName = t[0] + t[1].charAt(0).toUpperCase() + t[1].slice(1);
        } else {
            tName = this.tool;
        }

        const service = tName + 'Service';

        this[service].update(id, data).subscribe(async (res: any) => {
            this.act = 'put';
            this.res = data;
            this.updateTable = true;
            this.alertService.success('Item has been updated!', true);
        });
    }

    // DELETE
    delete(id: any): void {
        let tName: string | null = null;
        if (this.tool.indexOf('_') !== -1) {
            const t = this.tool.split('_');
            tName = t[0] + t[1].charAt(0).toUpperCase() + t[1].slice(1);
        } else {
            tName = this.tool;
        }

        const service = tName + 'Service';

        this[service].delete(id).subscribe(async (res: any) => {
            this.act = 'delete';
            this.res = id;
            this.updateTable = true;
            this.alertService.success('Item has been deleted!', true);
        });
    }
}
