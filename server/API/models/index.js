const config = require("../../config/db.config.js");
const fs = require("fs");
const Sequelize = require("sequelize");
const { QueryTypes } = require('sequelize');

const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect,
    synchronize: false,

    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle
    }
  }
); 


// Get Tables
let makeMyAPIForMe = () => {
  sequelize.query('SHOW Tables', {
    type: sequelize.QueryTypes.SHOWTABLES
  })
  .then(async (result) => {
    console.log(result);
    for(let i=0; i<result.length; i++){
      if(result[i] != 'index.js' &&
      result[i] != 'user_roles' && 
      result[i] != 'users' && 
      result[i] != 'roles' &&
      result[i] != 'albums' &&
      result[i] != 'artists' &&
      result[i] != 'artists_links' &&
      result[i] != 'artist_members' &&
      result[i] != 'comments' &&
      result[i] != 'contacts' &&
      result[i] != 'documents' &&
      result[i] != 'friends' &&
      result[i] != 'images' &&
      result[i] != 'socials' &&
      result[i] != 'songs' &&
      result[i] != 'videos'){
        let cols = await sequelize.query(`SELECT COLUMN_NAME, DATA_TYPE  from INFORMATION_SCHEMA. COLUMNS where table_schema = 'MF2023' and table_name = '${result[i]}'`, { type: QueryTypes.SELECT });
        console.log(result[i]);
        console.log(cols);


        if (fs.existsSync(`../client/src/app/services/${result[i]}.service.ts`)) {
          fs.unlinkSync(`../client/src/app/services/${result[i]}.service.ts`);
        }
        if (fs.existsSync(`../client/src/app/models/${result[i]}.model.ts`)) {
          fs.unlinkSync(`../client/src/app/models/${result[i]}.model.ts`);
        }
        if (fs.existsSync(`./API/routes/${result[i]}.js`)) {
          fs.unlinkSync(`./API/routes/${result[i]}.js`);
        }
        if (fs.existsSync(`./API/models/${result[i]}.model.js`)) {
          fs.unlinkSync(`./API/models/${result[i]}.model.js`);
        }
        if (fs.existsSync(`./API/controllers/${result[i]}.controller.js`)) {
          fs.unlinkSync(`./API/controllers/${result[i]}.controller.js`);
        }

        // CLIENTSIDE 
        // service
        fs.copyFile(`../client/src/app/services/tmp.service.ts`, `../client/src/app/services/${result[i]}.service.ts`, (err) => {
          if (err) throw err;
          console.log(`template.service was copied to ${result[i]}.service`);
        });

        // model type
        let front_model = `export class ${result[i]} {\n`;
        for(let k=0; k<cols.length; k++) {
          let newType='';
          if(cols[k].COLUMN_NAME == 'id'){
            newType = 'any';
          }else if(cols[k].DATA_TYPE == "int"){
            newType = 'number';
          }else if(cols[k].DATA_TYPE == "varchar"){
            newType = 'string';
          }else if(cols[k].DATA_TYPE == "datetime"){
            newType = 'string';
          }
          
          front_model += `${cols[k].COLUMN_NAME}?: ${newType};\n`;
        }
        front_model += "}";

        fs.appendFile(`../client/src/app/models/${result[i]}.model.ts`, front_model, function (err) {
          if (err) throw err;
          console.log('File is created successfully.');
        });
        

        // SERVERSIDE 
        // routes
        fs.copyFile(`./API/routes/tmp.js`, `./API/routes/${result[i]}.js`, (err) => {
          if (err) throw err;
          console.log(`template.route was copied to ${result[i]}.route`);
        });

        // models
        let start = "let path = require('path');\n";
        start += "let scriptName = path.basename(__filename);\n\n";
        start += "module.exports = (sequelize, Sequelize) => {\n";
        start += "  const ItemTopic = sequelize.define(`${scriptName}`, {\n";

        let col_names = '';
        for(let k=0; k<cols.length; k++){
          if(cols[k].COLUMN_NAME != 'id'){
            let newType='';
            if(cols[k].DATA_TYPE == "int"){
              newType = 'INTEGER';
            }else if(cols[k].DATA_TYPE == "varchar"){
              newType = 'STRING';
            }else if(cols[k].DATA_TYPE == "datetime"){
              newType = 'STRING';
            }
            
            col_names += `      ${cols[k].COLUMN_NAME}: {
      type: Sequelize.${newType}
    },\n`;
          }
        }

        let end = ` });
    
  return ItemTopic;
};`;

        let content = start + col_names + end;

        fs.appendFile(`./API/models/${result[i]}.model.js`, content, function (err) {
          if (err) throw err;
          console.log('File is created successfully.');
        });

        // controllers
        fs.copyFile(`./API/controllers/tmp.controller.js`, `./API/controllers/${result[i]}.controller.js`, (err) => {
          if (err) throw err;
          console.log(`template.controller was copied to ${result[i]}.controller`);
        });
      }
    }
  });
}
//makeMyAPIForMe();


const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

fs.readdirSync(__dirname).forEach((file) => {
  if(file != "index.js"){
    db[`${file.split('.')[0].slice(0, -1)}`] = require(`./${file}`)(sequelize, Sequelize);
  }
})


// User Based Roles
db.role.belongsToMany(db.user, {
  through: "user_roles",
  foreignKey: "roleId",
  otherKey: "userId"
});
db.user.belongsToMany(db.role, {
  through: "user_roles",
  foreignKey: "userId",
  otherKey: "roleId"
});
// User Based Roles End


db.ROLES = ["user", "admin", "moderator"];

module.exports = db;