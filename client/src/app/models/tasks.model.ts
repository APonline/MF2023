export class tasks {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    task?: string;
    description?: string;
    assigned_to?: number;
    assigned_by?: number;
    status?: string;
    priority?: string;
    completed_by?: string;
    date_completed?: string;
    active?: string;
    profile_url?: string;
    column_key?: string;
    sort_index?: number;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof tasks> = [
        "id",
        "owner_user",
        "owner_group",
        "task",
        "description",
        "assigned_to",
        "assigned_by",
        "status",
        "priority",
        "completed_by",
        "date_completed",
        "profile_url",
        "column_key",
        "sort_index"
    ];

    static keys(): Array<keyof tasks> {
        return tasks.FIELDS.slice();
    }
}
