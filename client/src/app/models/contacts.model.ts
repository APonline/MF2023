export class contacts {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    first_name?: string;
    last_name?: string;
    company?: string;
    relation?: string;
    city?: string;
    profile_url?: string;
    phone?: string;
    email?: string;
    active?: number;
    contact_image?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof contacts> = [
        "id",
        "owner_user",
        "owner_group",
        "first_name",
        "last_name",
        "company",
        "relation",
        "city",
        "profile_url",
        "phone",
        "email",
        "contact_image"
    ];

    static keys(): Array<keyof contacts> {
        return contacts.FIELDS.slice();
    }
}
