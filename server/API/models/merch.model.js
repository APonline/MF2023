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
      category: {
      type: Sequelize.INTEGER
    },
      title: {
      type: Sequelize.STRING
    },
      description: {
      type: Sequelize.STRING
    },
      in_stock: {
      type: Sequelize.INTEGER
    },
      sizes: {
      type: Sequelize.STRING
    },
      main_image_url: {
      type: Sequelize.STRING
    },
      views: {
      type: Sequelize.INTEGER
    },
      active: {
      type: Sequelize.INTEGER
    },
      profile_url: {
      type: Sequelize.STRING
    }
 });
    
return ItemTopic;
};