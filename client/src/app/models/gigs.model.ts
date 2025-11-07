export class gigs {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    event?: string;
    day?: string;
    show_time?: string;
    location?: string;
    tickets_url?: string;
    active?: number;
    profile_url?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof gigs> = [
        "id",
        "owner_user",
        "owner_group",
        "event",
        "day",
        "show_time",
        "location",
        "tickets_url",
        "profile_url"
    ];

    static keys(): Array<keyof gigs> {
        return gigs.FIELDS.slice();
    }
}
