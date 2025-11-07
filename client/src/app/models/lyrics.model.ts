export class lyrics {
    id?: any;
    owner_album?: number;
    owner_song?: number;
    title?: string;
    lyrics?: string;
    owner_user?: number;
    author?: string;
    profile_url?: string;
    owner_group?: number;
    active?: number;
    tags?: string;
    plaviewsys?: number;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof lyrics> = [
        "id",
        "owner_album",
        "owner_song",
        "title",
        "lyrics",
        "owner_user",
        "author",
        "profile_url",
        "owner_group",
        "tags",
        "plaviewsys"
    ];

    static keys(): Array<keyof lyrics> {
        return lyrics.FIELDS.slice();
    }
}
