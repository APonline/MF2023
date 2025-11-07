export class socials {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    title?: string;
    username?: string;
    password?: string;
    url?: string;
    access_key?: string;
    token_key?: string;
    secret_id?: string;
    api_url?: string;
    active?: number;
    profile_url?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof socials> = [
        "id",
        "owner_user",
        "owner_group",
        "title",
        "username",
        "password",
        "url",
        "access_key",
        "token_key",
        "secret_id",
        "api_url",
        "profile_url"
    ];

    static keys(): Array<keyof socials> {
        return socials.FIELDS.slice();
    }
}
