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

/* services - make dynamic somehow later */
import { ArtistsService } from 'src/app/services/artists.service';
import { PlannerService } from 'src/app/services/planner.service';
import { ArtistActivityService } from 'src/app/services/artist_activity.service';

import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { DialogService } from 'src/app/services/dialog.service';
import { MFService } from 'src/app/services/MF.service';
import { planner } from 'src/app/models/planner.model';
import { EventCardComponent } from './event-card/event-card.component';

/* ------------------------------------------------------------------
 * Session type meta (colour + label) – keep in sync with EventCard
 * ------------------------------------------------------------------ */

interface SessionTypeMeta {
    value: string;
    label: string;
    color: string;
    group: string;
}

const SESSION_TYPE_META: { [key: string]: SessionTypeMeta } = {
    // PERFORMANCE – red
    gig:               { value: 'gig',               label: 'Gig',                          color: '#ff4d4d', group: 'performance' },
    soundcheck:        { value: 'soundcheck',        label: 'Soundcheck / Load-in',         color: '#ff4d4d', group: 'performance' },
    travel:            { value: 'travel',            label: 'Travel / Transit',             color: '#ff4d4d', group: 'performance' },

    // PRACTICE & PREP – orange
    rehearsal:         { value: 'rehearsal',         label: 'Jam / Rehearsal',              color: '#ff9a3c', group: 'practice' },
    tour_rehearsal:    { value: 'tour_rehearsal',    label: 'Tour Rehearsal',               color: '#ff9a3c', group: 'practice' },
    acoustic_rehearsal:{ value: 'acoustic_rehearsal',label: 'Acoustic Rehearsal',           color: '#ff9a3c', group: 'practice' },

    // STUDIO / CONTENT – blue
    studio:            { value: 'studio',            label: 'Studio Session',               color: '#3aa5ff', group: 'studio' },
    writing:           { value: 'writing',           label: 'Writing Session',              color: '#3aa5ff', group: 'studio' },
    preprod:           { value: 'preprod',           label: 'Pre-Production',               color: '#3aa5ff', group: 'studio' },
    recording:         { value: 'recording',         label: 'Recording Session',            color: '#3aa5ff', group: 'studio' },
    overdub:           { value: 'overdub',           label: 'Overdub Session',              color: '#3aa5ff', group: 'studio' },
    mix_review:        { value: 'mix_review',        label: 'Mix Review',                   color: '#f8ff3aff', group: 'studio' },
    mastering_review:  { value: 'mastering_review',  label: 'Mastering Review',             color: '#f8ff3aff', group: 'studio' },

    video_shoot:       { value: 'video_shoot',       label: 'Video Shoot',                  color: '#3aff40ff', group: 'studio' },
    photoshoot:        { value: 'photoshoot',        label: 'Photoshoot',                   color: '#3aff40ff', group: 'studio' },
    content_day:       { value: 'content_day',       label: 'Content Capture / Social Day', color: '#3aff40ff', group: 'studio' },
    interview:         { value: 'interview',         label: 'Interview / Press',            color: '#3aff40ff', group: 'studio' },

    // BUSINESS – purple
    band_meeting:      { value: 'band_meeting',      label: 'Band Meeting',                 color: '#b366ff', group: 'business' },
    management_meeting:{ value: 'management_meeting',label: 'Management Meeting',           color: '#b366ff', group: 'business' },
    marketing_planning:{ value: 'marketing_planning',label: 'Marketing / Release Planning', color: '#b366ff', group: 'business' },

    // OTHER – grey
    other:             { value: 'other',             label: 'Other',                        color: '#7a7a7a', group: 'other' }
};


function getSessionTypeMeta(type: string | null | undefined): SessionTypeMeta {
    const key = (type || 'other').toLowerCase();
    return SESSION_TYPE_META[key] || SESSION_TYPE_META['other'];
}

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
    currentUserId: number | null = null;
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
        isToday?: boolean;
    }[] = [];

    weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // --- deep-link state (like Contacts) ---
    private deepLinkSessionId: number | null = null;
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
        private authenticationService: AuthenticationService,
        public MF: MFService,
        private artistActivityService: ArtistActivityService,
        private plannerService: PlannerService
    ) {
        this.currentUser = this.authenticationService.currentUserValue || null;
        this.currentUserId = this.currentUser?.id ?? null;
    }

    // -----------------------------------
    // Lifecycle
    // -----------------------------------

    ngOnInit(): void {
        this.imageKey = this.MF.buildImageKey(this.toolName);

        // --- routing: read ?sessionId= from query params (deep link) ---
        this.route.queryParamMap.subscribe(params => {
            const id = params.get('sessionId');
            this.deepLinkSessionId = id ? +id : null;
        });

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

            this.table?.renderRows();
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

            // --- deep-link: auto-open sessionId if present (and only once) ---
            if (this.deepLinkSessionId && !this.deepLinkHandled && Array.isArray(this.toolSet)) {
                const match = this.toolSet.find((s: any) => s.id === this.deepLinkSessionId);

                if (match) {
                    this.deepLinkHandled = true;
                    setTimeout(() => this.openDialog('Update', match), 0);
                }
            }
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

        // session_type column (for completeness)
        this.displayedColumns.push('session_type');
        form['session_type'] = new FormControl('');
        newForm['session_type'] = '';

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

    // -----------------------------------
    // Dialog + persistence
    // -----------------------------------

    openDialog(action: string, row: any): void {
        const seed = this.MF
            .compose(row || {})
            .with({
                owner_group: this.artist?.id,
                owner_user: row?.owner_user ?? this.currentUser?.id ?? this.currentUserId,
                group: this.artist?.name
            })
            .done();

        console.log('[PlannerForm] openDialog()', action, 'seed:', seed);

        const dialogRef = this.dialog.open(EventCardComponent, {
            panelClass: 'dialog-box',
            width: '640px',
            data: {
                action,
                seed,
                artist_id: this.artist?.id,
                current_user_id: this.currentUser?.id ?? this.currentUserId
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('[PlannerForm] dialog closed, raw result:', result);
            if (!result) return;

            const raw   = result.data || {};
            const evt   = (result.event || action || '').toString().toLowerCase();
            const rowId = row?.id ?? null;
            const rawId = raw?.id ?? null;
            const hasId = !!(rawId ?? rowId);

            let op: 'create' | 'update' | 'delete';
            if (evt === 'delete')      op = 'delete';
            else if (!hasId)           op = 'create';
            else                       op = 'update';

            const targetId = (rawId ?? rowId) || null;

            // duration_minutes -> duration for backend
            const durationMinutes = Number(raw.duration_minutes ?? raw.duration ?? 0);

            // helper to build deep link
            const buildDeepLink = (id: number | null, src: any): string | null => {
                if (!id) return null;

                const title = src.title || 'session';
                const titleSlug = title
                    .toString()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .toLowerCase();

                const handle      = this.artist?.profile_url || `@${this.group}`;
                const featurePath = (this.toolName || 'planner').toLowerCase();
                const baseLink    =
                    `/projects/new-edit/${this.groupId}/${this.group}/${featurePath}`;

                return `${baseLink}?sessionId=${id}&slug=${handle}-${titleSlug}`;
            };

            // base payload: force owner_user + duration
            const baseCore = this.MF
                .compose(raw)
                .with({
                    id: targetId || undefined,
                    owner_group: this.artist?.id,
                    owner_user: raw.owner_user ?? this.currentUser.id,
                    duration: isNaN(durationMinutes) ? 0 : durationMinutes,
                    active: op === 'delete' ? 0 : 1
                })
                .done();

            console.log('[PlannerForm] baseCore before persist:', baseCore);

            let persist$;

            if (op === 'create') {
                persist$ = this.plannerService.create(baseCore);
            } else if (op === 'update') {
                if (!targetId) {
                    this.alertService.error('Unable to update session (no id).');
                    return;
                }

                const deepLink = buildDeepLink(targetId, baseCore);
                const payload = {
                    ...baseCore,
                    profile_url: deepLink || baseCore.profile_url
                };

                persist$ = this.plannerService.update(targetId, payload);
            } else {
                if (!targetId) {
                    this.alertService.error('Unable to delete session (no id).');
                    return;
                }
                persist$ = this.plannerService.delete(targetId);
            }

            persist$.subscribe({
                next: (serverRes: any) => {
                    console.log('[PlannerForm] serverRes from plannerService:', serverRes);

                    let serverRow = serverRes;
                    if (serverRow && serverRow.data) serverRow = serverRow.data;
                    if (serverRow && serverRow.row)  serverRow = serverRow.row;
                    if (serverRow && Array.isArray(serverRow.rows)) {
                        serverRow = serverRow.rows[0];
                    }

                    let effectiveRow: any = {
                        ...(baseCore || {}),
                        ...(serverRow || {})
                    };

                    if (!effectiveRow.id && targetId) {
                        effectiveRow.id = targetId;
                    }

                    // ensure we keep duration + duration_minutes in the UI row
                    const effDuration = Number(
                        effectiveRow.duration ?? effectiveRow.duration_minutes ?? durationMinutes
                    );
                    effectiveRow.duration = isNaN(effDuration) ? 0 : effDuration;
                    effectiveRow.duration_minutes = effectiveRow.duration;

                    // CREATE: patch profile_url once we know id
                    if (op === 'create' && effectiveRow.id) {
                        const deepLink = buildDeepLink(effectiveRow.id, effectiveRow);
                        if (deepLink) {
                            effectiveRow.profile_url = deepLink;
                            this.plannerService
                                .update(effectiveRow.id, {
                                    id: effectiveRow.id,
                                    profile_url: deepLink
                                })
                                .subscribe({
                                    error: err =>
                                        console.warn('[planner] profile_url patch failed', err)
                                });
                        }
                    }

                    // update local arrays
                    if (!Array.isArray(this.dataSource)) this.dataSource = [];
                    if (!Array.isArray(this.toolSet)) this.toolSet = [];

                    if (op === 'create') {
                        this.dataSource = [...this.dataSource, effectiveRow];
                        this.toolSet    = [...this.toolSet, effectiveRow];
                    } else if (op === 'update') {
                        this.dataSource = this.dataSource.map((s: any) =>
                            s.id === effectiveRow.id ? { ...s, ...effectiveRow } : s
                        );
                        this.toolSet = this.toolSet.map((s: any) =>
                            s.id === effectiveRow.id ? { ...s, ...effectiveRow } : s
                        );
                    } else if (op === 'delete') {
                        this.dataSource = this.dataSource.filter(
                            (s: any) => s.id !== effectiveRow.id
                        );
                        this.toolSet = this.toolSet.filter(
                            (s: any) => s.id !== effectiveRow.id
                        );
                    }

                    this.table?.renderRows?.();
                    this.buildCalendar();

                    // ---- activity (use session type + colour, not title/date) ----
                    const typeMeta   = getSessionTypeMeta(effectiveRow.session_type);
                    const typeLabel  = typeMeta.label;    // e.g. "Studio Session"
                    const typeColor  = typeMeta.color;    // hex colour
                    const typePhrase = `${typeLabel} session`;

                    const actor = {
                        id: this.currentUser?.id,
                        username: this.currentUser?.username
                    };

                    const feature = {
                        feature: (this.toolName || 'Session').replace(/s$/i, ''),
                        extra: null
                    };

                    let verb: 'create' | 'update' | 'delete' = op;
                    let verbText = '';
                    if (verb === 'create')      verbText = 'created';
                    else if (verb === 'update') verbText = 'updated';
                    else if (verb === 'delete') verbText = 'deleted';

                    const labelInner =
                        `<span style="color:${typeColor}"><b>${typePhrase}</b></span>`;

                    const activity =
                        verb === 'delete' || !effectiveRow.profile_url
                            ? `${verbText} a ${labelInner}`
                            : `${verbText} a ` +
                              `<a href="${effectiveRow.profile_url}" style="color:${typeColor}">${labelInner}</a>`;

                    this.artistActivityService
                        .logChange(activity, {
                            actor,
                            artistId: this.groupId,
                            groupId: this.groupId,
                            feature
                        })
                        .subscribe();

                    this.activeItem.emit({ action: op, data: effectiveRow });
                },
                error: err => {
                    console.error('[PlannerForm] Failed to persist session change', err);
                    this.alertService.error('Unable to save session');
                }
            });
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

    getEventsForDate(date: Date): any[] {
        const target = moment(date);

        return (this.toolSet || [])
            .filter((ev: any) => this.occursOnDate(ev, date))
            .map((ev: any) => {
                // Clone so we can put instance-specific data on it
                const cloned = { ...ev };

                const baseMoment = moment(ev.start_at || ev.selected_date);
                if (baseMoment.isValid()) {
                    // Use the same time-of-day, but on the target date
                    const instanceMoment = target
                        .clone()
                        .hour(baseMoment.hour())
                        .minute(baseMoment.minute())
                        .second(baseMoment.second() || 0)
                        .millisecond(0);

                    // This is what the calendar should use for display
                    cloned._instance_start_at = instanceMoment.toISOString();
                } else {
                    cloned._instance_start_at = ev.start_at || ev.selected_date || null;
                }

                return cloned;
            });
    }


    // ---- calendar helpers for colours / labels ----

    getEventStyle(ev: any): { [k: string]: string } {
        const meta  = getSessionTypeMeta(ev?.session_type);
        const base  = meta.color || '#ff4d4d';
        const grad  = `linear-gradient(135deg, ${base}, ${base}cc)`; 

        return {
            background: grad,
            borderColor: base,
            color: '#000'   // black text on coloured pill
        };
    }

    getSessionTypeLabel(type: string | null | undefined): string {
        return getSessionTypeMeta(type).label;
    }

    formatEventTime(ev: any): string {
        const src = ev?._instance_start_at || ev?.start_at || ev?.selected_date;
        if (!src) {
            return '';
        }

        const m = moment(src);
        if (!m.isValid()) {
            return '';
        }

        const fmt = m.minute() === 0 ? 'h a' : 'h:mm a';
        return m.format(fmt);
    }

    // -----------------------------------
    // Calendar interactions
    // -----------------------------------

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

    occursOnDate(ev: any, date: Date): boolean {
      if (!ev) {
          return false;
      }

      const rawStart = ev.start_at || ev.selected_date;
      if (!rawStart) {
          return false;
      }

      const start = moment(rawStart);
      if (!start.isValid()) {
          return false;
      }

      const target = moment(date).startOf('day');

      // Non-recurring: simple same-day check
      const isRecurring = !!ev.is_recurring;
      if (!isRecurring || !ev.recurrence_freq) {
          return target.isSame(start, 'day');
      }

      // If we have an end date, respect it
      if (ev.recurrence_until) {
          const until = moment(ev.recurrence_until).endOf('day');
          if (!until.isValid() || target.isAfter(until, 'day')) {
              return false;
          }
      }

      // Recurring logic (v1: weekly)
      const freq = String(ev.recurrence_freq).toLowerCase();

      if (freq === 'weekly' || freq === 'biweekly') {
          // Must be on or after the first date
          if (target.isBefore(start, 'day')) {
              return false;
          }

          // Same weekday as original start
          if (target.day() !== start.day()) {
              return false;
          }

          const diffDays = target.diff(start.clone().startOf('day'), 'days');

          if (freq === 'weekly') {
              // Every 7 days
              return diffDays % 7 === 0;
          }

          if (freq === 'biweekly') {
              // Every 14 days
              return diffDays % 14 === 0;
          }
      }

      // Unknown recurrence -> fall back to single date only
      return target.isSame(start, 'day');
  }

}
