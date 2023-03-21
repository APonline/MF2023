let path = require('path');
let scriptName = path.basename(__filename).split('.')[0];

module.exports = (sequelize, Sequelize) => {
    const ItemTopic = sequelize.define(`${scriptName}`, {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING
        }
    });
  
    return ItemTopic;
};