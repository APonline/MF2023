let path = require('path');
let scriptName = path.basename(__filename);

module.exports = (sequelize, Sequelize) => {
  const ItemTopic = sequelize.define(`${scriptName}`, {
      owner_user: {
      type: Sequelize.INTEGER
    },
      owner_group: {
      type: Sequelize.INTEGER
    },
      url: {
      type: Sequelize.STRING
    },
      title: {
      type: Sequelize.STRING
    },
      description: {
      type: Sequelize.STRING
    },
      profile_url: {
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
 });
    
return ItemTopic;
};