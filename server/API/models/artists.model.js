let path = require('path');
let scriptName = path.basename(__filename).split('.')[0];

module.exports = (sequelize, Sequelize) => {
    const ItemTopic = sequelize.define(`${scriptName}`, {
        owner_user: {
            type: Sequelize.STRING
        },
        name: {
            type: Sequelize.STRING
        },
        active: {
            type: Sequelize.INTEGER
        },
        date_joined: {
            type: Sequelize.STRING
        },
        genre: {
            type: Sequelize.STRING
        },
        profile_url: {
            type: Sequelize.STRING
        },

    });
  
    return ItemTopic;
}; 