const db = require("../models");
let p = require('path');
const scriptName = p.basename(__filename).split('.')[0];
let itemTopic = scriptName.charAt(0).toUpperCase() + scriptName.slice(1);
( itemTopic.substring(itemTopic.length - 1) == 's' ? itemTopic = itemTopic.slice(0, -1) : itemTopic = itemTopic);
let itemTitle = `${scriptName.slice(0, -1)}`;
const Item = db[itemTitle];
const sequelize = require('sequelize');

let datetime = new Date();
let joined =
datetime.getFullYear() + "-" +
("00" + (datetime.getMonth() + 1)).slice(-2) + "-" +
("00" + datetime.getDate()).slice(-2);

exports[`create${itemTopic}`] = async (req, res) => {
    try{
        let newItem = req.body;

        let result = await Item.create( newItem );

        if (result) {
            return res.status(200).send( result );
        }else{
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to create ${itemTopic}! ${error.message}`
        });
    }
}
exports[`get${itemTopic}`] = async (req, res) => {
    try{
        let id =req.params.id;
        let result = await Item.findOne({ where: { id } });

        if (result) {
            return res.status(200).send( result );
        }else{
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}!`
        });
    }
}
exports[`find${itemTopic}Name`] = async (req, res) => {
    try{
        let name =req.params.name;
        let result = await Item.findOne({ 
            where: {
                    name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', '%' + name + '%')
            }
        });

        if (result) {
            return res.status(200).send( result );
        }else{
            return res.status(200).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to find ${itemTopic}!`
        });
    }
}
exports[`getAll${itemTopic}s`] = async (req, res) => {
    
    try{
        let result = await Item.findAll({ where: { active: 1 } });

        if (result) {
            return res.status(200).send( result );
        }else{
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}s!`
        });
    }
}

exports[`update${itemTopic}`] = async (req, res) => {
    try{
        let id =req.body.id;
        let result = await Item.update( req.body,{ where: { id } });

        if (result) {
            return res.status(200).send( result );
        }else{
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to update ${itemTopic}!  ${error.message}`
        });
    }
}
exports[`delete${itemTopic}`] = async (req, res) => {
    try{
        let id =req.params.id;
        await Item.destroy({ where: { id } })
        .then(function(rowDeleted){ 
            if(rowDeleted === 1){
                return res.status(200).send({ result: [] });
            }else{
                return res.status(500).send({ result: null });
            }
          }, function(err){
              console.log(err); 
          });
    } catch (error) {
        return res.status(500).send({
            message: `Unable to delete ${itemTopic}! - `+ error.message
        });
    }
}