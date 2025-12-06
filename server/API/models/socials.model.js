let path = require('path');
let scriptName = path.basename(__filename);
scriptName = scriptName.split('.')[0];

module.exports = (sequelize, Sequelize) => {
    const Social = sequelize.define(`${scriptName}`, {
        owner_user: {
            type: Sequelize.INTEGER
        },
        owner_group: {
            type: Sequelize.INTEGER
        },
        title: {
            type: Sequelize.STRING
        },
        username: {
            type: Sequelize.STRING
        },
        password: {
            type: Sequelize.STRING
        },
        url: {
            type: Sequelize.STRING
        },
        profile_url: {
            type: Sequelize.STRING
        },

        // --- NEW FIELDS / RENAMED FIELDS ------------------------

        // e.g. 'facebook','instagram','youtube','tiktok','x','spotify','other'
        platform: {
            type: Sequelize.ENUM(
                'facebook',
                'instagram',
                'youtube',
                'tiktok',
                'x',
                'spotify',
                'other'
            ),
            defaultValue: 'other'
        },

        // is this profile actually wired for API posting?
        is_api_enabled: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },

        // page_id, channel_id, ig_business_id, etc.
        platform_account_id: {
            type: Sequelize.STRING
        },

        // app/client credentials
        client_id: {
            type: Sequelize.STRING
        },
        client_secret: {
            type: Sequelize.STRING
        },

        // OAuth tokens (encrypt these at app level)
        access_token: {
            type: Sequelize.TEXT
        },
        refresh_token: {
            type: Sequelize.TEXT
        },
        token_type: {
            type: Sequelize.STRING
        },
        token_expires_at: {
            type: Sequelize.DATE
        },

        // base URL of the API, e.g. https://graph.facebook.com/v21.0/
        api_base_url: {
            type: Sequelize.STRING
        },

        // arbitrary per-account config
        metadata_json: {
            type: Sequelize.JSON
        },
        post_json: {
            type: Sequelize.JSON
        },

        // --------------------------------------------------------

        active: {
            type: Sequelize.INTEGER
        }
    }, {
        tableName: scriptName,
        timestamps: true   // or true if you're using createdAt/updatedAt through Sequelize
    });

    return Social;
};
