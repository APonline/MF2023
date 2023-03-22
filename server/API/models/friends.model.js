let path = require('path');
let scriptName = path.basename(__filename);

module.exports = (sequelize, Sequelize) => {
  const ItemTopic = sequelize.define(`${scriptName}`, {
      user_id: {
      type: Sequelize.INTEGER
    },
      friend_id: {
      type: Sequelize.INTEGER
    },
      status: {
      type: Sequelize.STRING
    },
      createdAt: {
      type: Sequelize.STRING
    },
      updatedAt: {
      type: Sequelize.STRING
    },
      date_joined: {
      type: Sequelize.STRING
    },
 });
    
return ItemTopic;
};