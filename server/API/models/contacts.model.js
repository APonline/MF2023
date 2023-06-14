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
      first_name: {
      type: Sequelize.STRING
    },
      last_name: {
      type: Sequelize.STRING
    },
      nickname: {
      type: Sequelize.STRING
    },
      relation: {
      type: Sequelize.STRING
    },
      town: {
      type: Sequelize.STRING
    },
      city: {
      type: Sequelize.STRING
    },
      profile_url: {
      type: Sequelize.STRING
    },
      phone: {
      type: Sequelize.STRING
    },
      email: {
      type: Sequelize.STRING
    },
      active: {
      type: Sequelize.INTEGER
    },
      contact_image: {
      type: Sequelize.STRING
    },
 });
    
return ItemTopic;
};