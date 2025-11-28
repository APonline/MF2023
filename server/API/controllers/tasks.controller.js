const db = require("../models");
let p = require('path');
const scriptName = p.basename(__filename).split('.')[0];
let itemTopic = scriptName.charAt(0).toUpperCase() + scriptName.slice(1);
( itemTopic.substring(itemTopic.length - 1) == 's' ? itemTopic = itemTopic.slice(0, -1) : itemTopic = itemTopic);
let itemTitle = `${scriptName.slice(0, -1)}`;
const Item = db[itemTitle];
const User = db.user;   

let datetime = new Date(); 

exports[`create${itemTopic}`] = async (req, res) => {
    try{
        let newItem = req.body;

        let result1 = await Item.findOne({ where: { id: newItem.id } });

        if (result1 == null) {

            try {
                let result = await Item.create( newItem );

                if (result) {
                    return res.status(200).send( result );
                }else{
                    return res.status(500).send({ result: null });
                }

            } catch (error) {
                return res.status(500).send({
                    message: `A Unable to create ${itemTopic}! - ` + error.message
                });
            }

        }else{
            return res.status(200).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `B Unable to find ${itemTopic}! - ` + error.message
        })
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
            where: { owner_group: id, active: 1 }
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
exports[`update${itemTopic}`] = async (req, res) => {
    try {
        const id = req.params.id;        // ✅ from URL /tasks/:id

        if (!id) {
            return res.status(400).send({
                message: `Missing id for ${itemTopic} update`
            });
        }

        // don't let id in the body mess with the update
        const payload = { ...req.body };
        delete payload.id;

        const [affectedRows] = await Item.update(payload, { where: { id } });

        if (affectedRows === 1) {
            return res.status(200).send({ result: true });
        } else {
            return res.status(404).send({
                result: null,
                message: `${itemTopic} not found`
            });
        }
    } catch (error) {
        console.error(`update${itemTopic} error`, error);
        return res.status(500).send({
            message: `Unable to update ${itemTopic}! - ` + error.message
        });
    }
};

// Archive instead of hard delete
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
exports[`get${itemTopic}Board`] = async (req, res) => {
    try {
        const { owner_group, owner_user } = req.query;

        const where = { active: 1 };
        if (owner_group) where.owner_group = owner_group;
        if (owner_user) where.owner_user = owner_user;

        const result = await Item.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'assignee',
                    attributes: ['id', 'username', 'first_name', 'last_name', 'profile_url']
                },
                // optional:
                { model: User, as: 'assigner', attributes: ['id', 'username'] }
            ],
            order: [
                ['column_key', 'ASC'],
                ['sort_index', 'ASC'],
                ['id', 'ASC']
            ]
        });

        const grouped = result.reduce((acc, item) => {
            const col = item.column_key || item.status || 'todo';
            if (!acc[col]) acc[col] = [];
            acc[col].push(item);
            return acc;
        }, {});

        return res.status(200).send(grouped);
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic} board! - ` + error.message
        });
    }
};

exports[`move${itemTopic}`] = async (req, res) => {
    try {
        const id = req.params.id;
        const { column_key, status, sort_index } = req.body;

        const item = await Item.findOne({ where: { id } });

        if (!item) {
            return res.status(404).send({
                message: `${itemTopic} not found`
            });
        }

        // Update kanban-related fields
        if (column_key !== undefined) {
            item.column_key = column_key;
        }

        // Optionally keep status in sync with column
        if (status !== undefined) {
            item.status = status;
        } else if (column_key) {
            // if you want, map column_key directly to status by default
            item.status = column_key;
        }

        if (sort_index !== undefined) {
            item.sort_index = sort_index;
        }

        // If it’s being moved into a "done" column, stamp completion date
        if ((column_key === "done" || status === "done") && !item.date_completed) {
            item.date_completed = new Date();
        }

        await item.save();

        return res.status(200).send(item);
    } catch (error) {
        return res.status(500).send({
            message: `Unable to move ${itemTopic}! - ` + error.message
        });
    }
}
