const db = require('../models');
let p = require('path');
const scriptName = p.basename(__filename).split('.')[0];

let itemTopic = scriptName.charAt(0).toUpperCase() + scriptName.slice(1);
itemTopic =
    itemTopic.substring(itemTopic.length - 1) === 's'
        ? itemTopic.slice(0, -1)
        : itemTopic;

let itemTitle = `${scriptName.slice(0, -1)}`;
const Item = db[itemTitle];
const Op = db.Sequelize.Op;

let datetime = new Date();

exports[`create${itemTopic}`] = async (req, res) => {
    try {
        let newItem = req.body;

        // Default active to 1 if not provided
        if (newItem.active === undefined || newItem.active === null) {
            newItem.active = 1;
        }

        // If front-end sends 'id' only for update, this prevents accidental dup blocks
        let result1 = null;
        if (newItem.id) {
            result1 = await Item.findOne({ where: { id: newItem.id } });
        }

        if (!result1) {
            try {
                const result = await Item.create(newItem);

                if (result) {
                    return res.status(200).send(result);
                } else {
                    return res.status(500).send({ result: null });
                }
            } catch (error) {
                return res.status(500).send({
                    message: `A Unable to create ${itemTopic}! - ` + error.message
                });
            }
        } else {
            // already exists – you could also choose to treat this as an update
            return res.status(200).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `B Unable to find ${itemTopic}! - ` + error.message
        });
    }
};

exports[`get${itemTopic}`] = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await Item.findOne({ where: { id } });

        if (result) {
            return res.status(200).send(result);
        } else {
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}!`
        });
    }
};

exports[`getAll${itemTopic}s`] = async (req, res) => {
    try {
        const result = await Item.findAll({ where: { active: 1 } });

        if (result) {
            return res.status(200).send(result);
        } else {
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}s!`
        });
    }
};

exports[`getAllFor${itemTopic}artist`] = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await Item.findAll({
            where: { owner_group: id, active: 1 }
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

exports[`update${itemTopic}`] = async (req, res) => {
    try {
        const id = req.params.id || req.body.id;
        const result = await Item.update(req.body, { where: { id } });

        if (result) {
            return res.status(200).send(result);
        } else {
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to update ${itemTopic}!`
        });
    }
};

exports[`delete${itemTopic}`] = async (req, res) => {
    try {
        const id = req.params.id;

        // set active = 0 instead of destroying the row
        const [affectedRows] = await Item.update(
            { active: 0 },
            { where: { id } }
        );

        if (affectedRows === 1) {
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

// OPTIONAL: Get events in a date range for a group – for calendar views
exports[`get${itemTopic}Range`] = async (req, res) => {
    try {
        const { start, end, owner_group } = req.query;

        if (!start || !end || !owner_group) {
            return res.status(400).send({
                message: 'Missing start, end, or owner_group query params'
            });
        }

        const result = await Item.findAll({
            where: {
                active: 1,
                owner_group: owner_group,
                start_at: {
                    [Op.between]: [start, end]
                }
            },
            order: [['start_at', 'ASC']]
        });

        return res.status(200).send(result);
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}s in range! - ` + error.message
        });
    }
};
