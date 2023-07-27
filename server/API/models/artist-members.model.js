let path = require('path');
let scriptName = path.basename(__filename);
scriptName = scriptName.split('.')[0];


module.exports = (sequelize, Sequelize) => {
  const ItemTopic = sequelize.define(`${scriptName}`, {
      owner_user: {
      type: Sequelize.INTEGER
    },
      owner_group: {
      type: Sequelize.INTEGER
    },
      user_id: {
      type: Sequelize.INTEGER
    },
      artist_id: {
      type: Sequelize.INTEGER
    },
      active: {
      type: Sequelize.INTEGER
    },
      date_joined: {
      type: Sequelize.STRING
    },
      profile_url: {
      type: Sequelize.STRING
    },
      role: {
      type: Sequelize.STRING
    },
 });
    
return ItemTopic;
};