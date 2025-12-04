export class socials {
    id?: any;
    owner_user?: number;
    owner_group?: number;
    title?: string;
    username?: string;
    password?: string;
    url?: string;
    profile_url?: string;
    active?: number;

    // --- NEW FIELDS / RENAMED FIELDS ------------------------

    platform?: "facebook" | "instagram" | "youtube" | "tiktok" | "x" | "spotify" | "other";
    is_api_enabled?: boolean;

    platform_account_id?: string;

    client_id?: string;
    client_secret?: string;

    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    token_expires_at?: string | Date;

    api_base_url?: string;

    metadata_json?: any;
    post_json?: any;

    // --------------------------------------------------------

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof socials> = [
        "id",
        "owner_user",
        "owner_group",
        "title",
        "username",
        "password",
        "url",
        "profile_url",
        "active",

        "platform",
        "is_api_enabled",
        "platform_account_id",

        "client_id",
        "client_secret",
        "access_token",
        "refresh_token",
        "token_type",
        "token_expires_at",

        "api_base_url",
        "metadata_json",
        "post_json"
    ];

    static keys(): Array<keyof socials> {
        return socials.FIELDS.slice();
    }
}
