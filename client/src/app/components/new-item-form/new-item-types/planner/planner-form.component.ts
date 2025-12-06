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
import {
    FormBuilder,
    FormGroup,
    Validators,
    FormControl
} from '@angular/forms';
import { AuthenticationService } from '../../../../services/authentication.service';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import moment from 'moment';
import { NewItemUpdateComponent } from '../../../new-item-update/new-item-update.component';

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
import { PlannerService } from 'src/app/services/planner.service';

import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { DialogService } from 'src/app/services/dialog.service';
import { MFService } from 'src/app/services/MF.service';
import { planner } from 'src/app/models/planner.model';

@Component({
    selector: 'app-plannerForm',
    templateUrl: './planner-form.component.html',
    styleUrls: ['./planner-form.component.scss']
})
export class PlannerFormComponent implements OnInit, OnChanges {
    @Output() activeItem = new EventEmitter<any>();

    @Input() action: string;
    @Input() editUser: number;
    @Input() updateTable: boolean;
    @Input() res: any;
    @Input() act: any;
    @Input() tool: string;
    @Input() toolName: string;
    @Input() group: string;
    @Input() groupId: string;

    @ViewChild(MatTable, { static: true }) table: MatTable<any>;

    currentUser: any;
    imageKey = '';

    displayedColumns: string[] = [];
    dataSource: any[] = [];
    newRecord: any = null;

    dataReady = false;
    modeSubmit = 'Submit';
    delUser = false;
    projectTypeClicked = false;

    thisUser: '';
    toolSet: any[] = [];
    modelSet: any;
    adminForm: FormGroup = this.formBuilder.group({});

    root = environment.root;
    artist: any;
    model = planner;

    // ---- Calendar state ----
    currentDate: Date = new Date();
    calendarView: 'month' | 'week' = 'month';

    // month view: 6 weeks x 7 days
    calendarWeeks: {
        date: Date;
        isCurrentMonth: boolean;
        isToday: boolean;
        events: any[];
    }[][] = [];

    // week view
    weekDaysForCurrentWeek: {
        label: string;
        date: Date;
        events: any[];
    }[] = [];

    weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    constructor(
        public dialog: MatDialog,
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private user: UserService,
        private router: Router,
        private DialogService: DialogService,
        private alertService: AlertService,
        private artistsService: ArtistsService,
        private authenticationService: AuthenticationService,
        public MF: MFService,

        // dynamic service injections (needed for this[service] trick)
        private imagesService: ImagesService,
        private albumsService: AlbumsService,
        private artistsLinksService: ArtistsLinksService,
        private artistMembersService: ArtistMembersService,
        private commentsService: CommentsService,
        private contactsService: ContactsService,
        private documentsService: DocumentsService,
        private friendsService: FriendsService,
        private gigsService: GigsService,
        private socialsService: SocialsService,
        private songsService: SongsService,
        private vidoesService: VidoesService,
        private plannerService: PlannerService
    ) {}

    // -----------------------------------
    // Lifecycle
    // -----------------------------------

    ngOnInit(): void {
        this.imageKey = this.MF.buildImageKey(this.toolName);

        this.artistsService.get(this.groupId).subscribe(res => {
            this.artist = res;
        });

        this.loadData();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.updateTable && this.dataSource) {
            if (this.act === 'create') {
                Object.keys(this.res).forEach(key => {
                    if (key === 'createdAt' || key === 'updatedAt' || key === 'active') {
                        delete this.res[key];
                    }
                });
                this.dataSource.push(this.res);
            } else if (this.act === 'put') {
                this.dataSource = this.dataSource.filter(value => {
                    if (value.id === this.res.id) {
                        this.displayedColumns.forEach(col => {
                            if (col in this.res) {
                                value[col] = this.res[col];
                            }
                        });
                    }
                    return true;
                });
            } else if (this.act === 'delete') {
                this.dataSource = this.dataSource.filter(value => value.id !== this.res);
            }

            if (this.table) {
                this.table.renderRows();
            }

            this.toolSet = this.dataSource;
            this.buildCalendar();
        }
    }

    // -----------------------------------
    // Data / table setup
    // -----------------------------------

    async loadData(): Promise<void> {
        // Build service name from tool string (e.g. "planner" -> "plannerService")
        let toolTitle: any = this.tool.split('_');
        toolTitle = this.MF.capitalizeWords(toolTitle);

        let toolTitle2 = toolTitle.join(',');
        toolTitle2 = toolTitle2.replace(/ /g, '');
        toolTitle2 = toolTitle2.replace(/,/g, '');
        toolTitle2 = toolTitle2.charAt(0).toLowerCase() + toolTitle2.slice(1);

        const serviceName = toolTitle2 + 'Service';

        await this[serviceName].getAllForArtist(this.groupId).subscribe((res: any[]) => {
            this[this.tool] = res;
            this.toolSet = this[this.tool];
            this.setSettings(this.toolSet);
        });
    }

    setSettings(formData: any[]): void {
        const form: any = {};
        const newForm: any = {};

        let f: any = null;
        if (formData.length === 0) {
            f = formData;
        } else {
            f = formData[0];
        }

        // columns
        this.displayedColumns = [];
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

        this.displayedColumns.push('title');
        form['title'] = new FormControl('', Validators.required);
        newForm['title'] = '';

        this.displayedColumns.push('description');
        form['description'] = new FormControl('');
        newForm['description'] = '';

        this.displayedColumns.push('location');
        form['location'] = new FormControl('');
        newForm['location'] = '';

        this.displayedColumns.push('duration');
        form['duration'] = new FormControl('');
        newForm['duration'] = '';

        this.displayedColumns.push('attendees');
        form['attendees'] = new FormControl('');
        newForm['attendees'] = '';

        // NOTE: still using selected_date for now; backend can later switch to start_at
        this.displayedColumns.push('selected_date');
        form['selected_date'] = new FormControl('');
        newForm['selected_date'] = '';

        this.displayedColumns.push('profile_url');
        form['profile_url'] = new FormControl('');
        newForm['profile_url'] = '';

        // strip meta fields from table view
        this.toolSet.forEach((item: any) => {
            delete item.active;
            delete item.createdAt;
            delete item.updatedAt;
        });

        const ds = new MatTableDataSource(this.toolSet);
        this.dataSource = ds.data;

        this.newRecord = newForm;
        this.adminForm = new FormGroup(form);

        this.buildCalendar();
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

    openDialog(action: string, obj: any): void {
        obj.action = action;
        obj.tool = this.toolName;

        const dialogRef = this.dialog.open(NewItemUpdateComponent, {
            panelClass: 'dialog-box',
            width: '85%',
            height: '80vh',
            data: obj
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                result.data.profile_url =
                    this.artist?.profile_url +
                    '-' +
                    result.data.title.replace(/\+s/g, '').toLowerCase();

                result.data.owner_group = this.artist?.id;

                this.activeItem.emit({ action: result.event, data: result.data });
            }
        });
    }

    // -----------------------------------
    // Calendar logic
    // -----------------------------------

    setCalendarView(view: 'month' | 'week'): void {
        this.calendarView = view;
        this.buildCalendar();
    }

    goToday(): void {
        this.currentDate = new Date();
        this.buildCalendar();
    }

    goPrev(): void {
        if (this.calendarView === 'month') {
            this.currentDate = new Date(
                this.currentDate.getFullYear(),
                this.currentDate.getMonth() - 1,
                1
            );
        } else {
            this.currentDate = moment(this.currentDate).subtract(7, 'days').toDate();
        }
        this.buildCalendar();
    }

    goNext(): void {
        if (this.calendarView === 'month') {
            this.currentDate = new Date(
                this.currentDate.getFullYear(),
                this.currentDate.getMonth() + 1,
                1
            );
        } else {
            this.currentDate = moment(this.currentDate).add(7, 'days').toDate();
        }
        this.buildCalendar();
    }

    private buildCalendar(): void {
        if (!this.toolSet) {
            this.calendarWeeks = [];
            this.weekDaysForCurrentWeek = [];
            return;
        }

        if (this.calendarView === 'month') {
            this.buildMonthGrid();
        } else {
            this.buildWeekList();
        }
    }

    private buildMonthGrid(): void {
        const startOfMonth = moment(this.currentDate).startOf('month');
        const endOfMonth = moment(this.currentDate).endOf('month');

        const startGrid = startOfMonth.clone().startOf('week'); // Sunday
        const endGrid = endOfMonth.clone().endOf('week');

        const weeks: any[][] = [];
        let current = startGrid.clone();

        while (current.isSameOrBefore(endGrid, 'day')) {
            const week: any[] = [];
            for (let i = 0; i < 7; i++) {
                const date = current.toDate();
                week.push({
                    date,
                    isCurrentMonth: current.month() === startOfMonth.month(),
                    isToday: current.isSame(moment(), 'day'),
                    events: this.getEventsForDate(date)
                });
                current.add(1, 'day');
            }
            weeks.push(week);
        }

        this.calendarWeeks = weeks;
    }

    private buildWeekList(): void {
        const startOfWeek = moment(this.currentDate).startOf('week');
        const days: any[] = [];

        for (let i = 0; i < 7; i++) {
            const d = startOfWeek.clone().add(i, 'day');
            const date = d.toDate();
            days.push({
                label: d.format('ddd'),
                date,
                events: this.getEventsForDate(date),
                isToday: d.isSame(moment(), 'day')
            });
        }

        this.weekDaysForCurrentWeek = days;
    }

    private getEventsForDate(date: Date): any[] {
        const target = moment(date).format('YYYY-MM-DD');

        return (this.toolSet || []).filter((ev: any) => {
            const raw = ev.start_at || ev.selected_date;
            if (!raw) {
                return false;
            }
            return moment(raw).format('YYYY-MM-DD') === target;
        });
    }

    openAddForDate(date: Date, ev?: MouseEvent): void {
        if (ev) {
            ev.stopPropagation();
        }

        const base = { ...(this.newRecord || {}) };

        // using selected_date for now; can be switched to start_at later
        base['selected_date'] = moment(date)
            .hour(19)
            .minute(0)
            .second(0)
            .toISOString();

        this.openDialog('Add', base);
    }

    openEvent(item: any, ev?: MouseEvent): void {
        if (ev) {
            ev.stopPropagation();
        }
        this.openDialog('Update', item);
    }

    openDayDetails(day: any, ev?: MouseEvent): void {
        if (ev) {
            ev.stopPropagation();
        }
        if (day.events && day.events.length) {
            this.openEvent(day.events[0]);
        }
    }
}
