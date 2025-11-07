export class schedule {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    selected_date?: string;
    attendees?: string;
    duration?: number;
    title?: string;
    description?: string;
    location?: string;
    active?: string;
    profile_url?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof schedule> = [
        "id",
        "owner_user",
        "owner_group",
        "selected_date",
        "attendees",
        "duration",
        "title",
        "description",
        "location",
        "profile_url"
    ];

    static keys(): Array<keyof schedule> {
        return schedule.FIELDS.slice();
    }
}
