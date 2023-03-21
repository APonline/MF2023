let path = require('path');
let scriptName = path.basename(__filename).split('.')[0];

module.exports = (sequelize, Sequelize) => {
  const ItemTopic = sequelize.define(`${scriptName}`, {
    user_id: {
      type: Sequelize.INTEGER
    },
    artist_id: {
      type: Sequelize.INTEGER
    },
    active: {
      type: Sequelize.INTEGER
    },
    date_joined: {
      type: Sequelize.STRING
    },
    createdAt: {
      type: Sequelize.STRING
    },
    updatedAt: {
      type: Sequelize.STRING
    },});
  
  return ItemTopic;
};