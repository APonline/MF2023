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
     task: {
      type: Sequelize.STRING
    },
     description: {
      type: Sequelize.STRING
    },
     assigned_to: {
      type: Sequelize.INTEGER
    },
     assigned_by: {
      type: Sequelize.INTEGER
    },
     status: {
      type: Sequelize.STRING
    },
    priority: {
      type: Sequelize.STRING
    },
     completed_by: {
      type: Sequelize.DATE
    },
     date_completed: {
      type: Sequelize.DATE,
      allowNull: true
    },
     active: {
      type: Sequelize.INTEGER
    },
     profile_url: {
      type: Sequelize.STRING
     },
     column_key: {
      type: Sequelize.STRING
    },
     sort_index: {
      type: Sequelize.INTEGER
     }
 });
    
  return ItemTopic;
};