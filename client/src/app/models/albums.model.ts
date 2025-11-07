export class albums {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    title?: string;
    record_label?: string;
    release_year?: string;
    track_count?: number;
    active?: number;
    profile_url?: string;
    album_front_image?: string;
    album_back_image?: string;
    album_linernotes_image?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof albums> = [
        "id",
        "owner_user",
        "owner_group",
        "title",
        "record_label",
        "release_year",
        "track_count",
        "profile_url",
        "album_front_image",
        "album_back_image",
        "album_linernotes_image"
    ];

    static keys(): Array<keyof albums> {
        return albums.FIELDS.slice();
    }
}
