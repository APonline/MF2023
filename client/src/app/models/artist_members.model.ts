export class artist_members {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    user_id?: number;
    artist_id?: number;
    active?: number;
    date_joined?: string;
    profile_url?: string;
    role?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof artist_members> = [
        "id",
        "owner_user",
        "owner_group",
        "user_id",
        "artist_id",
        "date_joined",
        "profile_url",
        "role"
    ];

    static keys(): Array<keyof artist_members> {
        return artist_members.FIELDS.slice();
    }
}
