export class merch_categories {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    title?: string;
    description?: string;
    active?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof merch_categories> = [
        "id",
        "owner_user",
        "owner_group",
        "title",
        "description"
    ];

    static keys(): Array<keyof merch_categories> {
        return merch_categories.FIELDS.slice();
    }
}
