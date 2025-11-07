export class user {
    id?: any;
    firstname?: string;
    lastname?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
    phone?: string;
    city?: string;
    country?: string;
    age?: string;
    gender?: string;
    birthday?: string;
    password?: string;
    date_joined?: string;
    last_login?: string;
    login_count?: number;
    profile_url?: string;
    profile_image?: string;
    verified?: number;
    tna?: number;
    online?: number;
    token?: string;

    // Single source of truth for runtime:
    static readonly FIELDS: Array<keyof user> = [
        "id",
        "firstname",
        "lastname",
        "first_name",
        "last_name",
        "username",
        "email",
        "phone",
        "city",
        "country",
        "age",
        "gender",
        "birthday",
        "password",
        "date_joined",
        "last_login",
        "login_count",
        "profile_url",
        "profile_image",
        "verified",
        "tna",
        "online",
        "token"
    ];

    static keys(): Array<keyof user> {
        return user.FIELDS.slice();
    }
}
