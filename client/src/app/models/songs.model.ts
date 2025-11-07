export class songs {
    id?: any;
    owner_album?: number;
    title?: string;
    duration?: string;
    owner_user?: number;
    author?: string;
    profile_url?: string;
    owner_group?: number;
    active?: number;
    tags?: string;
    plays?: number;
    location_url?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof songs> = [
        "id",
        "owner_user",
        "owner_group",
        "owner_album",
        "title",
        "duration",
        "author",
        "tags",
        "plays",
        "profile_url",
        "location_url"
    ];

    static keys(): Array<keyof songs> {
        return songs.FIELDS.slice();
    }
}
