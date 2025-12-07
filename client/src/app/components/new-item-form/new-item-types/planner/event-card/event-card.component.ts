import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MFService } from 'src/app/services/MF.service';
import * as moment from 'moment';

/* ------------------------------------------------------------------
 * Session type meta (colour + label) – keep in sync with PlannerForm
 * ------------------------------------------------------------------ */

interface SessionTypeMeta {
    value: string;
    label: string;
    color: string;
    group: string;
}

const SESSION_TYPE_META: { [key: string]: SessionTypeMeta } = {
    // PERFORMANCE – red
    gig:               { value: 'gig',               label: 'Gig',                          color: '#E74C3C', group: 'performance' },
    soundcheck:        { value: 'soundcheck',        label: 'Soundcheck / Load-in',         color: '#E74C3C', group: 'performance' },
    travel:            { value: 'travel',            label: 'Travel / Transit',             color: '#E74C3C', group: 'performance' },

    // REHEARSAL – orange
    rehearsal:         { value: 'rehearsal',         label: 'Jam / Rehearsal',              color: '#E67E22', group: 'rehearsal' },
    tour_rehearsal:    { value: 'tour_rehearsal',    label: 'Tour Rehearsal',               color: '#E67E22', group: 'rehearsal' },
    acoustic_rehearsal:{ value: 'acoustic_rehearsal',label: 'Acoustic Rehearsal',           color: '#E67E22', group: 'rehearsal' },

    // STUDIO / CREATIVE – purple
    studio:            { value: 'studio',            label: 'Studio Session',               color: '#9B59B6', group: 'studio' },
    writing:           { value: 'writing',           label: 'Writing Session',              color: '#9B59B6', group: 'studio' },
    preprod:           { value: 'preprod',           label: 'Pre-Production',               color: '#9B59B6', group: 'studio' },
    tracking:          { value: 'tracking',          label: 'Tracking Session',             color: '#9B59B6', group: 'studio' },
    overdub:           { value: 'overdub',           label: 'Overdub Session',              color: '#9B59B6', group: 'studio' },
    mix_review:        { value: 'mix_review',        label: 'Mix Review',                   color: '#9B59B6', group: 'studio' },
    mastering_review:  { value: 'mastering_review',  label: 'Mastering Review',             color: '#9B59B6', group: 'studio' },

    // MEDIA / CONTENT – blue
    video_shoot:       { value: 'video_shoot',       label: 'Video Shoot',                  color: '#3498DB', group: 'media' },
    photoshoot:        { value: 'photoshoot',        label: 'Photoshoot',                   color: '#3498DB', group: 'media' },
    content_day:       { value: 'content_day',       label: 'Content Capture / Social Day', color: '#3498DB', group: 'media' },
    interview:         { value: 'interview',         label: 'Interview / Press',            color: '#3498DB', group: 'media' },

    // BUSINESS – green
    band_meeting:      { value: 'band_meeting',      label: 'Band Meeting',                 color: '#2ECC71', group: 'business' },
    management_meeting:{ value: 'management_meeting',label: 'Management Meeting',           color: '#2ECC71', group: 'business' },
    marketing_planning:{ value: 'marketing_planning',label: 'Marketing / Release Planning', color: '#2ECC71', group: 'business' },

    // OTHER – grey
    other:             { value: 'other',             label: 'Other',                        color: '#95A5A6', group: 'other' }
};

function getSessionTypeMeta(type: string | null | undefined): SessionTypeMeta {
    const key = (type || 'other').toLowerCase();
    return SESSION_TYPE_META[key] || SESSION_TYPE_META['other'];
}

interface PlannerEventSeed {
    id?: number;
    title?: string;
    description?: string;
    session_type?: string;
    start_at?: string | Date | null;
    selected_date?: string | Date | null;   // legacy
    duration_minutes?: number;              // in minutes; 0 = all day
    location?: string;
    attendees?: any;                        // string | string[] | ids
    owner_group?: number;
    owner_user?: number;
    active?: number;
    profile_url?: string;
    // NEW recurrence fields
    is_recurring?: number | boolean;
    recurrence_freq?: string | null;
    recurrence_until?: string | Date | null;
    [key: string]: any;
}

@Component({
    selector: 'app-event-card',
    templateUrl: './event-card.component.html',
    styleUrls: ['./event-card.component.scss']
})
export class EventCardComponent implements OnInit {
    form: FormGroup;
    action: 'Add' | 'Update' | 'Delete';
    headerSubtitle = 'Session';

    sessionTypes = Object.values(SESSION_TYPE_META);

    // duration in minutes; 0 = all day
    durationOptions = [
        { value: 15,   label: '0.25 hr (15 min)' },
        { value: 30,   label: '0.5 hr (30 min)' },
        { value: 45,   label: '0.75 hr (45 min)' },
        { value: 60,   label: '1 hr (60 min)' },
        { value: 90,   label: '1.5 hr (90 min)' },
        { value: 120,  label: '2 hr (120 min)' },
        { value: 180,  label: '3 hr (180 min)' },
        { value: 240,  label: '4 hr (240 min)' },
        { value: 360,  label: '6 hr (360 min)' },
        { value: 480,  label: '8 hr (480 min)' },
        { value: 0,    label: 'All day' }
    ];

    members: any[] = [];

    constructor(
        private fb: FormBuilder,
        public MF: MFService,
        private dialogRef: MatDialogRef<EventCardComponent, { event: string; data: any }>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    get sessionTypeColor(): string {
        const type = this.form?.value?.session_type || 'other';
        return getSessionTypeMeta(type).color;
    }

    get sessionTypeLabel(): string {
        const type = this.form?.value?.session_type || 'other';
        return getSessionTypeMeta(type).label;
    }

    ngOnInit(): void {
        console.log('[EventCard] init, data:', this.data);

        this.action = this.data.action;  // 'Add' | 'Update' | 'Delete'
        const seed: PlannerEventSeed = (this.data.seed ?? this.data) || {};

        const rawStart = seed.start_at || seed.selected_date || this.data.start_at || null;
        const { date, time } = this.splitDateTime(rawStart);

        const defaultType = seed.session_type || 'other';
        const defaultDuration = seed.duration_minutes ?? 120; // 2h default

        const attendeesArray = this.normaliseAttendees(seed.attendees);

        const defaultIsRecurring =
            typeof seed.is_recurring === 'boolean'
                ? seed.is_recurring
                : !!seed.is_recurring;

        const defaultFreq = seed.recurrence_freq || 'weekly';
        const defaultUntil = seed.recurrence_until
            ? new Date(seed.recurrence_until as any)
            : null;

        this.form = this.fb.group({
            id: [seed.id],
            title: [seed.title || '', Validators.required],
            description: [seed.description || ''],

            date: [date, Validators.required],
            time: [time, Validators.required],
            duration_minutes: [defaultDuration, [Validators.required, Validators.min(0)]],
            session_type: [defaultType, Validators.required],

            location: [seed.location || ''],
            attendees: [attendeesArray],

            // recurrence
            is_recurring: [defaultIsRecurring],
            recurrence_freq: [defaultFreq],
            recurrence_until: [defaultUntil],

            owner_group: [seed.owner_group ?? this.data.artist_id ?? null],
            owner_user: [seed.owner_user ?? this.data.current_user_id ?? null],
            active: [seed.active != null ? seed.active : 1],
            profile_url: [seed.profile_url || '']
        });

        console.log('[EventCard] form initial value:', this.form.value);

        this.updateHeaderSubtitle();

        this.form.get('date')?.valueChanges.subscribe(() => this.updateHeaderSubtitle());
        this.form.get('time')?.valueChanges.subscribe(() => this.updateHeaderSubtitle());

        // load artist members for attendees select
        if (this.data.artist_id) {
            this.MF.getArtistMembers(this.data.artist_id).subscribe({
                next: (result: any[]) => {
                    this.members = result || [];
                    console.log('[EventCard] members loaded:', this.members);
                },
                error: (err) => {
                    console.error('[EventCard] Failed to load members', err);
                    this.members = [];
                }
            });
        }
    }

    /* ---------- Helpers ---------- */

    private splitDateTime(raw: string | Date | null | undefined): { date: Date | null; time: string } {
        if (!raw) {
            const now = new Date();
            now.setHours(19, 0, 0, 0);
            return { date: now, time: '19:00' };
        }

        const d = new Date(raw);
        if (isNaN(d.getTime())) {
            const now = new Date();
            now.setHours(19, 0, 0, 0);
            return { date: now, time: '19:00' };
        }

        const hours = d.getHours().toString().padStart(2, '0');
        const mins = d.getMinutes().toString().padStart(2, '0');

        return { date: d, time: `${hours}:${mins}` };
    }

    private normaliseAttendees(att: any): any[] {
        if (!att) {
            return [];
        }

        if (Array.isArray(att)) {
            return att;
        }

        try {
            const parsed = JSON.parse(att);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch (_) {}

        if (typeof att === 'string') {
            return att.split(',').map((x: string) => x.trim()).filter(Boolean);
        }

        return [att];
    }

    private buildStartAt(): string | null {
        const date: Date = this.form.value.date;
        const time: string = this.form.value.time;

        if (!date || !time) {
            return null;
        }

        const [hStr, mStr] = time.split(':');
        const h = parseInt(hStr || '0', 10);
        const m = parseInt(mStr || '0', 10);

        const dt = new Date(date);
        dt.setHours(h, m, 0, 0);

        return dt.toISOString();
    }

    private updateHeaderSubtitle(): void {
        const date: Date = this.form?.value?.date;
        const time: string = this.form?.value?.time;

        if (!date || !time) {
            this.headerSubtitle = this.action === 'Add'
                ? 'New session'
                : 'Edit session';
            return;
        }

        // Date: "Wed, Dec 10"
        const datePart = moment(date).format('ddd, MMM D');

        // Time: "7 pm" or "7:30 pm"
        const timeMoment = moment(time, 'HH:mm');
        let timePart = '';
        if (timeMoment.isValid()) {
            const fmt = timeMoment.minute() === 0 ? 'h A' : 'h:mm A';
            timePart = timeMoment
                .format(fmt)
                .replace('AM', 'am')
                .replace('PM', 'pm');
        }

        this.headerSubtitle = timePart
            ? `${datePart} • ${timePart}`
            : datePart;
    }

    /* ---------- UI actions ---------- */

    onSubmit(): void {
        console.log('[EventCard] onSubmit fired, valid?', this.form.valid, 'value:', this.form.value);
        this.save();
    }

    close(): void {
        console.log('[EventCard] close()');
        this.dialogRef.close();
    }

    onArchive(): void {
        console.log('[EventCard] onArchive()', this.form.value);

        if (!this.form.value.id) {
            this.dialogRef.close();
            return;
        }

        this.dialogRef.close({
            event: 'delete',
            data: this.form.value
        });
    }

    save(): void {
        console.log('[EventCard] save() called, valid?', this.form.valid);

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            console.warn('[EventCard] form invalid, aborting save');
            return;
        }

        const value: any = { ...this.form.value };

        const rawDuration = value.duration_minutes;
        const durationMinutes = Number(rawDuration ?? 0);
        value.duration_minutes = isNaN(durationMinutes) ? 0 : durationMinutes;

        const start_at = this.buildStartAt();
        value.start_at = start_at;
        value.selected_date = start_at; // legacy compatibility

        // normalise recurring flags
        value.is_recurring = value.is_recurring ? 1 : 0;

        if (value.recurrence_until instanceof Date) {
            value.recurrence_until = (value.recurrence_until as Date).toISOString();
        }

        if (Array.isArray(value.attendees)) {
            value.attendees = JSON.stringify(value.attendees);
        }

        const event: 'create' | 'put' =
            this.action === 'Add' ? 'create' : 'put';

        console.log('[EventCard] closing dialog with:', { event, data: value });

        this.dialogRef.close({
            event,
            data: value
        });
    }
}
