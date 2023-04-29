let path = require('path');
let scriptName = path.basename(__filename);
scriptName = scriptName.split('.')[0];


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
      date_joined: {
      type: Sequelize.STRING
    },
      active: {
      type: Sequelize.INTEGER
    },
 });
    
return ItemTopic;
};