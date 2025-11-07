export class campaigns {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    title?: string;
    description?: string;
    active?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof campaigns> = [
        "id",
        "owner_user",
        "owner_group",
        "title",
        "description"
    ];

    static keys(): Array<keyof campaigns> {
        return campaigns.FIELDS.slice();
    }
}
