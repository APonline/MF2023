let path = require('path');
let scriptName = path.basename(__filename);
scriptName = scriptName.split('.')[0];


module.exports = (sequelize, Sequelize) => {
  const ItemTopic = sequelize.define(`${scriptName}`, {
      owner_album: {
      type: Sequelize.INTEGER
    },
      title: {
      type: Sequelize.STRING
    },
      lyrics: {
      type: Sequelize.STRING
    },
      owner_user: {
      type: Sequelize.INTEGER
    },
      author: {
      type: Sequelize.STRING
    },
      profile_url: {
      type: Sequelize.STRING
    },
      owner_group: {
      type: Sequelize.INTEGER
    },
      active: {
      type: Sequelize.INTEGER
    },
      tags: {
      type: Sequelize.STRING
    },
      views: {
      type: Sequelize.INTEGER
    },
    owner_song: {
      type: Sequelize.INTEGER
    },

 });
    
return ItemTopic;
};