let path = require('path');
let scriptName = path.basename(__filename);
scriptName = scriptName.split('.')[0];

module.exports = (sequelize, Sequelize) => {
    const ItemTopic = sequelize.define(
        scriptName,
        {
            owner_user: {
                type: Sequelize.INTEGER
            },
            owner_group: {
                type: Sequelize.INTEGER
            },
            start_at: {
                type: Sequelize.DATE
            },
            duration: {
                type: Sequelize.INTEGER
            },
            is_recurring: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            recurrence_freq: {
                type: Sequelize.STRING(32),
                allowNull: true
            },
            recurrence_until: {
                type: Sequelize.DATE,
                allowNull: true
            },
            attendees: {
                type: Sequelize.TEXT      // more room than STRING(255)
            },
            title: {
                type: Sequelize.STRING
            },
            session_type: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.STRING
            },
            location: {
                type: Sequelize.STRING
            },
            active: {
                type: Sequelize.INTEGER,
                defaultValue: 1
            },
            profile_url: {
                type: Sequelize.STRING
            }
        },
        {
            tableName: scriptName,       // 'planner'
            timestamps: true,
            createdAt: 'createdAt',
            updatedAt: 'updatedAt'
        }
    );

    return ItemTopic;
};
