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
      owner_gallery: {
      type: Sequelize.INTEGER
    },
      title: {
      type: Sequelize.STRING
    },
      description: {
      type: Sequelize.STRING
    },
      duration: {
      type: Sequelize.STRING
    },
      genre: {
      type: Sequelize.STRING
    },
      extension: {
      type: Sequelize.STRING
    },
      tags: {
      type: Sequelize.STRING
    },
      active: {
      type: Sequelize.INTEGER
    },
      views: {
      type: Sequelize.INTEGER
    },
      profile_url: {
      type: Sequelize.STRING
    },
    location_url: {
      type: Sequelize.STRING
    },
 });
    
return ItemTopic;
};