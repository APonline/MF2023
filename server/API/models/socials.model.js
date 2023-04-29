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
      access_key: {
      type: Sequelize.STRING
    },
      token_key: {
      type: Sequelize.STRING
    },
      secret_id: {
      type: Sequelize.STRING
    },
      api_url: {
      type: Sequelize.STRING
    },
      active: {
      type: Sequelize.INTEGER
    },
 });
    
return ItemTopic;
};