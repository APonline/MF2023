let path = require('path');
let scriptName = path.basename(__filename);

module.exports = (sequelize, Sequelize) => {
  const ItemTopic = sequelize.define(`${scriptName}`, {
     owner_user: {
      type: Sequelize.INTEGER
    },
     owner_artist: {
      type: Sequelize.INTEGER
    },
     event: {
      type: Sequelize.STRING
    },
     day: {
      type: Sequelize.STRING
    },
     show_time: {
      type: Sequelize.STRING
    },
     location: {
      type: Sequelize.STRING
    },
     tickets_url: {
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