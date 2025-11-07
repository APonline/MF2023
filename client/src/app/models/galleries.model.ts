export class galleries {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    genre?: string;
    tags?: string;
    views?: number;
    title?: string;
    description?: string;
    active?: string;
    profile_url?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof galleries> = [
        "id",
        "owner_user",
        "owner_group",
        "genre",
        "tags",
        "views",
        "title",
        "description",
        "profile_url"
    ];

    static keys(): Array<keyof galleries> {
        return galleries.FIELDS.slice();
    }
}
