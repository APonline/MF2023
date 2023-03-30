let path = require('path');
let scriptName = path.basename(__filename);
scriptName = scriptName.split('.')[0];

module.exports = (sequelize, Sequelize) => {
  const ItemTopic = sequelize.define(`${scriptName}`, {
      owner_user: {
      type: Sequelize.INTEGER
    },
      name: {
      type: Sequelize.STRING
    },
      description: {
      type: Sequelize.STRING
    },
      bio: {
      type: Sequelize.TEXT
    },
      location: {
      type: Sequelize.STRING
    },
      active: {
      type: Sequelize.INTEGER
    },
      createdAt: {
      type: Sequelize.STRING
    },
      updatedAt: {
      type: Sequelize.STRING
    },
      genre: {
      type: Sequelize.STRING
    },
      profile_url: {
      type: Sequelize.STRING
    },
      date_joined: {
      type: Sequelize.STRING
    },
 });
    
return ItemTopic;
};