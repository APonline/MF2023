const db = require("../models");
const config = require("../../config/auth.config");
const User = db.user;
const Role = db.role;

const Op = db.Sequelize.Op; 

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

//import sendMailOut from '../../mailserver';
//import uniqueCredentials from '../../mailTemplates/signup';
const sendMailOut = require('../../mailserver');
const uniqueCredentials = require('../../mailTemplates/signup');

let datetime = new Date();
let lastLogin =
datetime.getFullYear() + "-" +
("00" + (datetime.getMonth() + 1)).slice(-2) + "-" +
("00" + datetime.getDate()).slice(-2) + " " +
("00" + datetime.getHours()).slice(-2) + ":" +
("00" + datetime.getMinutes()).slice(-2) + ":" +
("00" + datetime.getSeconds()).slice(-2);

exports.signup = async (req, res) => {
    // Save User to Database
    try {
        const user = await User.create({
            first_name: req.body.firstname,
            last_name: req.body.lastname,
            username: req.body.username,
            email: req.body.email,
            phone: req.body.phone,
            city: req.body.city,
            country: req.body.country,
            age: (req.body.age ? req.body.age : 0),
            gender: (req.body.gender ? req.body.gender : 0),
            birthday: (req.body.birthday ? req.body.birthday : 0),
            password: bcrypt.hashSync(req.body.password, 8),
            verified: 0,
            active: 1,
            date_joined: datetime.toISOString().slice(0,10),
            last_login: lastLogin,
            login_count: 1,
            profile_url: "@" + req.body.username.replace(/\+s/g,'').toLowerCase() + "",
            profile_image: "default",
            tna: 0
        });

        // sendmail
        let mailObj = uniqueCredentials(user.id, req.body.email, req.body.username);
        sendMailOut(req.body.email, mailObj.subject, mailObj.plainText, mailObj.template);

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
                email: req.body.email,
            }
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

        const userLoginCount = await User.update(
            {
                login_count: user.login_count + 1,
                last_login: lastLogin
            },{
                where: {
                    id: user.id,
                },
            }
        );
        if (!userLoginCount) {
            console.log('Login Count did not count');
        }

        let authorities = [];
        const roles = await user.getRoles();
        for (let i = 0; i < roles.length; i++) {
            authorities.push("ROLE_" + roles[i].name.toUpperCase());
        }

        req.session.token = token;

        return res.status(200).send({
            id: user.id,
            firstname: user.first_name,
            lastname: user.last_name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            city: user.city,
            country: user.country,
            age: user.age,
            gender: user.gender,
            birthday: user.birthday,
            date_joined: user.date_joined,
            last_login: user.last_login,
            profile_url: user.profile_url,
            profile_image: user.profile_image,
            roles: authorities,
            tna: user.tna,
            verified: user.verified,
            online: user.online,
            token: req.session.token
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