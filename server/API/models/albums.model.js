let path = require('path');
let scriptName = path.basename(__filename).split('.')[0];

module.exports = (sequelize, Sequelize) => {
  const ItemTopic = sequelize.define(`${scriptName}`, {
    owner_user: {
      type: Sequelize.INTEGER
    },
    owner_group: {
      type: Sequelize.INTEGER
    },
    name: {
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
    createdAt: {
      type: Sequelize.STRING
    },
    updatedAt: {
      type: Sequelize.STRING
    },});
  
  return ItemTopic;
};