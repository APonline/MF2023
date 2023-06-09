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
      record_label: {
      type: Sequelize.STRING
    },
      release_year: {
      type: Sequelize.STRING
    },
      track_count: {
      type: Sequelize.INTEGER
    },
      active: {
      type: Sequelize.INTEGER
    },
      profile_url: {
      type: Sequelize.STRING
    },
      album_front_image: {
      type: Sequelize.STRING
    },
      album_back_image: {
      type: Sequelize.STRING
    },
      album_linernotes_image: {
      type: Sequelize.STRING
    },
 });
    
return ItemTopic;
};