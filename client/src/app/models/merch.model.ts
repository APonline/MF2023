export class merch {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    category?: number;
    title?: string;
    description?: string;
    in_stock?: number;
    sizes?: string;
    views?: number;
    main_image_url?: string;
    active?: string;
    profile_url?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof merch> = [
        "id",
        "owner_user",
        "owner_group",
        "category",
        "title",
        "description",
        "in_stock",
        "sizes",
        "views",
        "main_image_url",
        "profile_url"
    ];

    static keys(): Array<keyof merch> {
        return merch.FIELDS.slice();
    }
}
