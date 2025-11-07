export class comments {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    item_id?: number;
    comment_txt?: string;
    tags?: string;
    timestamp?: string;
    active?: number;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof comments> = [
        "id",
        "owner_user",
        "owner_group",
        "item_id",
        "comment_txt",
        "tags",
        "timestamp"
    ];

    static keys(): Array<keyof comments> {
        return comments.FIELDS.slice();
    }
}
