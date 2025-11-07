export class documents {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    owner_gallery?: number;
    title?: string;
    description?: string;
    genre?: string;
    extension?: string;
    tags?: string;
    active?: number;
    views?: number;
    profile_url?: string;
    location_url?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof documents> = [
        "id",
        "owner_user",
        "owner_group",
        "owner_gallery",
        "title",
        "description",
        "genre",
        "extension",
        "tags",
        "views",
        "profile_url",
        "location_url"
    ];

    static keys(): Array<keyof documents> {
        return documents.FIELDS.slice();
    }
}
