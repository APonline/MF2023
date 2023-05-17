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
      genre: {
      type: Sequelize.STRING
    },
      profile_url: {
      type: Sequelize.STRING
    },
      profile_image: {
      type: Sequelize.STRING
    },
      profile_banner_image: {
      type: Sequelize.STRING
    },
      artist_image_1: {
      type: Sequelize.STRING
    },
      artist_image_2: {
      type: Sequelize.STRING
    },
      artist_image_3: {
      type: Sequelize.STRING
    },
      date_joined: {
      type: Sequelize.STRING
    },
 });
    
return ItemTopic;
};