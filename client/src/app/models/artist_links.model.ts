export class artist_links {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    url?: string;
    title?: string;
    description?: string;
    profile_url?: string;
    active?: number;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof artist_links> = [
        "id",
        "owner_user",
        "owner_group",
        "url",
        "title",
        "description",
        "profile_url"
    ];

    static keys(): Array<keyof artist_links> {
        return artist_links.FIELDS.slice();
    }
}
