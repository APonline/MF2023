export class friends {
    id?: any;
    user_id?: number;
    friend_id?: number;
    status?: string;
    date_joined?: string;
    active?: number;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof friends> = [
        "id",
        "user_id",
        "friend_id",
        "status",
        "date_joined"
    ];

    static keys(): Array<keyof friends> {
        return friends.FIELDS.slice();
    }
}
