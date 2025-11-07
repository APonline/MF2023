export class artist_activity {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    user_id?: number;
    artist_id?: number;
    active?: number;
    activity?: string;
    activity_url?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof artist_activity> = [
        "id",
        "owner_user",
        "owner_group",
        "user_id",
        "artist_id",
        "activity",
        "activity_url"
    ];

    static keys(): Array<keyof artist_activity> {
        return artist_activity.FIELDS.slice();
    }
}
