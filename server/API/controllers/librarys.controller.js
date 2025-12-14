const db = require("../models");
let p = require('path');
const scriptName = p.basename(__filename).split('.')[0];
let itemTopic = scriptName.charAt(0).toUpperCase() + scriptName.slice(1);
( itemTopic.substring(itemTopic.length - 1) == 's' ? itemTopic = itemTopic.slice(0, -1) : itemTopic = itemTopic);
let itemTitle = `${scriptName.slice(0, -1)}`;
const Item = db[itemTitle];
const Galleries = db.gallerie;
const fileController = require("./file.controller");

let datetime = new Date(); 

exports[`create${itemTopic}`] = async (req, res) => {
    try {
        const newItem = req.body || {};

        // ---- OPTIONAL: safe duplicate check by location_url ----
        // If you still want to avoid exact duplicates:
        if (newItem.location_url) {
            const existing = await Item.findOne({
                where: {
                    // if you want per-artist uniqueness, uncomment owner_group:
                    // owner_group: newItem.owner_group,
                    location_url: newItem.location_url
                }
            });

            if (existing) {
                // just return the existing row instead of { result: null }
                return res.status(200).send(existing);
            }
        }

        // ---- CREATE ----
        const created = await Item.create(newItem);

        return res.status(200).send(created);
    } catch (error) {
        console.error(`create${itemTopic} failed`, error);
        return res.status(500).send({
            message: `Unable to create ${itemTopic}! - ${error.message}`
        });
    }
};
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
exports[`getAllFor${itemTopic}artist`] = async (req, res) => {
    try{
        let id =req.params.id;
        let result = await Item.findAll({ 
            where: { owner_group: id, active: 1 },
            separate : true,
            limit: 9999,
            order: [
                ['id', 'DESC']
            ],
            include: [{
                model: Galleries,
                required: true,
                as: 'gallery',
                where: { owner_group: id, active: 1 } 
            }],
        });

        if (result) {
            return res.status(200).send( result );
        }else{
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}s! - `+ error.message
        });
    }
}
// images.controller.js

exports[`getAllFor${itemTopic}gallery`] = async (req, res) => {
    try {
        let id = req.params.id;

        let result = await Item.findAll({
            where: { owner_gallery: id, active: 1 }, // 👈 key change
            separate: true,
            limit: 9999,
            order: [
                ['id', 'ASC'] // oldest / first image in that gallery
            ]
        });

        if (result) {
            return res.status(200).send(result);
        } else {
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}s! - ` + error.message
        });
    }
}; 
exports[`getFirstFor${itemTopic}gallery`] = async (req, res) => {
    try {
        const galleryId = req.params.id;

        // 🔹 first active image that belongs to this gallery
        const image = await Item.findOne({
            where: { owner_gallery: galleryId, active: 1 },
            order: [["id", "ASC"]]
        });

        if (!image) {
            return res.status(200).send(null);
        }

        // 🔹 build the same "display" thumb you use elsewhere
        const group = 'artists/'+image.owner_group; // matches your folder layout
        const type = "image";
        const fileInfo = await fileController.getFileType(
            image.location_url,
            group,
            type
        );

        return res.status(200).send({
            ...image.toJSON(),
            preview: fileInfo?.display || null   // data:image/... or icon
        });
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get first ${itemTopic} for gallery! - ${error.message}`
        });
    }
};

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
    try {
        const id = req.params.id;

        // set active = 0 instead of destroying the row
        const [affectedRows] = await Item.update(
            { active: 0 },
            { where: { id } }
        );

        if (affectedRows === 1) {
            // keep your original success shape if other code depends on it
            return res.status(200).send({ result: [] });
        } else {
            return res.status(404).send({
                result: null,
                message: `${itemTopic} not found`
            });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to delete ${itemTopic}! - ` + error.message
        });
    }
};
exports[`Xdelete${itemTopic}`] = async (req, res) => {
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