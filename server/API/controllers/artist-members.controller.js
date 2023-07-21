const db = require("../models");
let p = require('path');
const scriptName = p.basename(__filename).split('.')[0];
let itemTopic = scriptName.charAt(0).toUpperCase() + scriptName.slice(1);
( itemTopic.substring(itemTopic.length - 1) == 's' ? itemTopic = itemTopic.slice(0, -1) : itemTopic = itemTopic);
let itemTitle = `${scriptName.slice(0, -1)}`;
const Item = db[itemTitle];
const Artists = db.artist;

let datetime = new Date(); 

exports[`create${itemTopic}`] = async (req, res) => {
    try{
        let newItem = req.body;

        let item = await Item.findOne({ where: { name: req.body.name } });

        if (item != null) { 
            var num = Math.floor(Math.random() * 90000) + 10000;
            newItem['profile_url'] = req.body.name + "_" + num;
        }

        let result = await User.create( newItem );

        if (result) {
            return res.status(200).send( result );
        }else{
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to create ${itemTopic}!`
        });
    }
}
exports[`get${itemTopic}`] = async (req, res) => {
    try{
        let id =req.params.id;
        let result = await User.findOne({ where: { id } });

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
exports[`getAllFor${itemTopic}`] = async (req, res) => {
    try{
        let id =req.params.id;
        let result = await Item.findAll({ 
            where: { user_id: id, active: 1 }, 
            include: [{
                model: Artists,
                required: true,
                as: 'artists',
                where: { active: 1 } 
            }],
        });

        if (result) {
            return res.status(200).send( result );
        }else{
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}s for user! -- ${error.message}`
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
            message: `Unable to update ${itemTopic}!`
        });
    }
}
exports[`delete${itemTopic}`] = async (req, res) => {
    try{
        let id =req.params.id;
        let result = await Item.destroy({ where: { id } });

        if (result) {
            return res.status(200).send( result );
        }else{
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to delete ${itemTopic}!`
        });
    }
}