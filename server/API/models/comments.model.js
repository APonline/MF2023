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
      item_id: {
      type: Sequelize.INTEGER
    },
      comment_txt: {
      type: Sequelize.TEXT
    },
      tags: {
      type: Sequelize.STRING
    },
      timestamp: {
      type: Sequelize.STRING
    },
      active: {
      type: Sequelize.INTEGER
    },
 });
    
return ItemTopic;
};