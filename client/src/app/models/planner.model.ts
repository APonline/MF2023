export class planner {
    id?: number;
    owner_user?: number;
    owner_group?: number;
    start_at?: string;        // ISO datetime from API
    duration?: number;        // minutes
    attendees?: string;       // for now: comma string or JSON string
    title?: string;
    description?: string;
    session_type?: string;
    // NEW: recurrence metadata
    is_recurring?: number;            // 0/1 from API
    recurrence_freq?: string | null;  // e.g. 'weekly'
    recurrence_until?: string | null; // ISO datetime
    location?: string;
    active?: number;
    profile_url?: string | null;
    createdAt?: string;
    updatedAt?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof planner> = [
        'id',
        'owner_user',
        'owner_group',
        'start_at',
        'duration',
        'attendees',
        'title',
        'description',
        'session_type',
        'is_recurring',
        'recurrence_freq',
        'recurrence_until',
        'location',
        'profile_url',
        'active',
        'createdAt',
        'updatedAt'
    ];

    static keys(): Array<keyof planner> {
        return planner.FIELDS.slice();
    }
}
