const db = require("../models");
const User = db.user;

exports.allAccess = (req, res) => {
    res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
    res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
    res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
    res.status(200).send("Moderator Content.");
};

exports.getUser = async (req, res) => {
    // Email
    let user = await User.findOne({
        where: {
            id: req.body.id
        }
    });

    if (user) {
        return res.status(200).send({
            user: user
        });
    }else{
        return res.status(500).send({
            user: null
        });
    }
}
exports.getAllUsers = async (req, res) => {
    // Email
    let user = await User.findAll({
        where: {
            active: 1
        }
    });

    if (user) {
        return res.status(200).send({
            user: user
        });
    }else{
        return res.status(500).send({
            user: null
        });
    }
}