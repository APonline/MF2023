const db = require("../models");
const config = require("../../config/auth.config");
const User = db.user;
const Role = db.role;

const Op = db.Sequelize.Op;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
    let datetime = new Date();
    let joinedDate =
    ("00" + (datetime.getMonth() + 1)).slice(-2) + "-" +
    ("00" + datetime.getDate()).slice(-2) + "-" +
    datetime.getFullYear() + " " +
    ("00" + datetime.getHours()).slice(-2) + ":" +
    ("00" + datetime.getMinutes()).slice(-2) + ":" +
    ("00" + datetime.getSeconds()).slice(-2);

    // Save User to Database
    try {
        const user = await User.create({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            username: req.body.username,
            email: req.body.email,
            phone: req.body.phone,
            city: req.body.city,
            country: req.body.country,
            password: bcrypt.hashSync(req.body.password, 8),
            verified: 0,
            active: 1,
            date_joined: datetime.toISOString().slice(0,10),
            last_login: joinedDate,
            login_count: 1,
            profile_url: "@" + req.body.username + "",
            profile_img: "images/defaultprofile.png"
        });

        if (req.body.roles) {
        const roles = await Role.findAll({
            where: {
            name: {
                [Op.or]: req.body.roles,
            },
            },
        });

        const result = user.setRoles(roles);
        if (result) res.send({ message: "User registered successfully!" });
        } else {
            // user has role = 1
            const result = user.setRoles([1]);
        if (result) res.send({ message: "User registered successfully!" });
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.signin = async (req, res) => {
    try {
        const user = await User.findOne({
        where: {
            username: req.body.username,
        },
        });

        if (!user) {
            return res.status(404).send({ message: "User Not found." });
        }

        const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
        );

        if (!passwordIsValid) {
            return res.status(401).send({
                message: "Invalid Password!",
            });
        }

        const token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400, // 24 hours
        });

        let authorities = [];
        const roles = await user.getRoles();
        for (let i = 0; i < roles.length; i++) {
            authorities.push("ROLE_" + roles[i].name.toUpperCase());
        }

        req.session.token = token;

        return res.status(200).send({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            city: user.city,
            country: user.country,
            date_joined: user.date_joined,
            last_login: user.last_login,
            profile_url: user.profile_url,
            profile_img: user.profile_img,
            roles: authorities,
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

exports.signout = async (req, res) => {
    try {
        req.session = null;
        return res.status(200).send({
        message: "You've been signed out!"
        });
    } catch (err) {
        this.next(err);
    }
};