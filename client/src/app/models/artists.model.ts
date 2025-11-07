export class artists {
    id?: any;
    owner_user?: number;
    name?: string;
    description?: string;
    bio?: string;
    location?: string;
    active?: number;
    genre?: string;
    profile_url?: string;
    profile_image?: string;
    profile_banner_image?: string;
    artist_image_1?: string;
    artist_image_2?: string;
    artist_image_3?: string;
    date_joined?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof artists> = [
        "id",
        "owner_user",
        "name",
        "description",
        "bio",
        "location",
        "genre",
        "profile_url",
        "profile_image",
        "profile_banner_image",
        "artist_image_1",
        "artist_image_2",
        "artist_image_3",
        "date_joined"
    ];

    static keys(): Array<keyof artists> {
        return artists.FIELDS.slice();
    }
}
