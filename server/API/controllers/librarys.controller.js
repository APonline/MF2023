const path = require("path");
const db = require("../models");
const fileController = require("./file.controller");

const scriptName = path.basename(__filename).split(".")[0]; // "librarys"

let itemTopic = scriptName.charAt(0).toUpperCase() + scriptName.slice(1);
// "Librarys" → "Library"
if (itemTopic.endsWith("s")) {
    itemTopic = itemTopic.slice(0, -1);
}

// model key – "librarys" → "library"
const itemTitle = scriptName.slice(0, -1);
const Item = db[itemTitle];

// associations
const Galleries = db.gallerie;
const datetime = new Date();

/**
 * CREATE
 */
exports[`create${itemTopic}`] = async (req, res) => {
    try {
        const newItem = req.body || {};

        // optional: avoid duplicate rows for same file
        if (newItem.location_url) {
            const existing = await Item.findOne({
                where: {
                    // if you want per-artist uniqueness, add owner_group here
                    location_url: newItem.location_url
                }
            });

            if (existing) {
                return res.status(200).send(existing);
            }
        }

        const created = await Item.create(newItem);
        return res.status(200).send(created);
    } catch (error) {
        console.error(`create${itemTopic} failed`, error);
        return res.status(500).send({
            message: `Unable to create ${itemTopic}! - ${error.message}`
        });
    }
};

/**
 * GET single
 */
exports[`get${itemTopic}`] = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await Item.findOne({ where: { id } });

        if (result) {
            return res.status(200).send(result);
        }

        return res.status(500).send({ result: null });
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}!`
        });
    }
};

/**
 * GET all active
 */
exports[`getAll${itemTopic}s`] = async (req, res) => {
    try {
        const result = await Item.findAll({ where: { active: 1 } });

        if (result) {
            return res.status(200).send(result);
        }

        return res.status(500).send({ result: null });
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}s!`
        });
    }
};

/**
 * GET all media for artist (images + videos + docs)
 * used by Angular library view
 */
exports[`getAllFor${itemTopic}artist`] = async (req, res) => {
    try {
        const id = req.params.id;

        const result = await Item.findAll({
            where: { owner_group: id, active: 1 },
            separate: true,
            limit: 9999,
            order: [["id", "DESC"]],
            include: [
                {
                    model: Galleries,
                    required: true,
                    as: "gallery",
                    where: { owner_group: id, active: 1 }
                }
            ]
        });

        if (result) {
            return res.status(200).send(result);
        }

        return res.status(500).send({ result: null });
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}s! - ${error.message}`
        });
    }
};

/**
 * GET all media for a single gallery (used for internal grids)
 */
exports[`getAllFor${itemTopic}gallery`] = async (req, res) => {
    try {
        const id = req.params.id;

        const result = await Item.findAll({
            where: { owner_gallery: id, active: 1 },
            separate: true,
            limit: 9999,
            order: [["id", "ASC"]]
        });

        if (result) {
            return res.status(200).send(result);
        }

        return res.status(500).send({ result: null });
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}s! - ${error.message}`
        });
    }
};

/**
 * GET first media record for a gallery, with preview hydrated.
 * Used for gallery “cover” tiles.
 */
exports[`getFirstFor${itemTopic}gallery`] = async (req, res) => {
    try {
        const galleryId = req.params.id;

        const media = await Item.findOne({
            where: { owner_gallery: galleryId, active: 1 },
            order: [["id", "ASC"]]
        });

        if (!media) {
            return res.status(200).send(null);
        }

        // derive extension & group
        const location = media.location_url || "";
        const ext =
            location.split(".").pop()?.toLowerCase() ||
            (media.extension || "").toLowerCase();

        const group = `artists/${media.owner_group}`;

        const fileInfo = await fileController.getFileType(
            location,
            group,
            ext
        );

        return res.status(200).send({
            ...media.toJSON(),
            preview: fileInfo?.display || null,
            extension: ext
        });
    } catch (error) {
        return res.status(500).send({
            message:
                `Unable to get first ${itemTopic} for gallery! - ` +
                error.message
        });
    }
};

/**
 * UPDATE
 */
exports[`update${itemTopic}`] = async (req, res) => {
    try {
        const id = req.body.id || req.params.id;
        if (!id) {
            return res.status(400).send({ message: "Missing id" });
        }

        const result = await Item.update(req.body, { where: { id } });

        if (Array.isArray(result) ? result[0] : result) {
            // fetch updated record so frontend has fresh data
            const updated = await Item.findOne({ where: { id } });
            return res.status(200).send(updated);
        }

        return res.status(500).send({ result: null });
    } catch (error) {
        return res.status(500).send({
            message: `Unable to update ${itemTopic}! - ${error.message}`
        });
    }
};

/**
 * Soft delete – set active = 0
 */
exports[`delete${itemTopic}`] = async (req, res) => {
    try {
        const id = req.params.id;

        const [affectedRows] = await Item.update(
            { active: 0 },
            { where: { id } }
        );

        if (affectedRows === 1) {
            return res.status(200).send({ result: [] });
        }

        return res.status(404).send({
            result: null,
            message: `${itemTopic} not found`
        });
    } catch (error) {
        return res.status(500).send({
            message: `Unable to delete ${itemTopic}! - ${error.message}`
        });
    }
};

/**
 * Hard delete (legacy – keep for emergencies)
 */
exports[`Xdelete${itemTopic}`] = async (req, res) => {
    try {
        const id = req.params.id;

        const rowDeleted = await Item.destroy({ where: { id } });

        if (rowDeleted === 1) {
            return res.status(200).send({ result: [] });
        }

        return res.status(500).send({ result: null });
    } catch (error) {
        return res.status(500).send({
            message: `Unable to delete ${itemTopic}! - ${error.message}`
        });
    }
};
