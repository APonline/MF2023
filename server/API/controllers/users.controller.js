const db = require("../models");
let p = require('path');
const scriptName = p.basename(__filename).split('.')[0];
let itemTopic = scriptName.charAt(0).toUpperCase() + scriptName.slice(1);
( itemTopic.substring(itemTopic.length - 1) == 's' ? itemTopic = itemTopic.slice(0, -1) : itemTopic = itemTopic);
let itemTitle = `${scriptName.slice(0, -1)}`;
const Item = db[itemTitle];

import sendMailOut from '../../mailserver';
import requestPassword from '../../mailTemplates/requestPassword';
import deleteAccount from '../../mailTemplates/deleteAccount';

let datetime = new Date();

// exports.allAccess = (req, res) => { res.status(200).send("Public Content."); };
// exports.userBoard = (req, res) => { res.status(200).send("User Content."); }; 
// exports.adminBoard = (req, res) => { res.status(200).send("Admin Content."); };
// exports.moderatorBoard = (req, res) => { res.status(200).send("Moderator Content."); };

let myClass = {};

myClass[`get${itemTopic}`] = async (req, res) => {
    try{
        let id =req.body.id;
        let result = await Item.findOne({ where: { id } });

        if (result) {
            return res.status(200).send({ result });
        }else{
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}!`
        });
    }
}
myClass[`getAll${itemTopic}s`] = async (req, res) => {
    try{
        let result = await Item.findAll({ where: { active: 1, online: 1 } });

        if (result) {
            return res.status(200).send({ [`${itemTitle}`]: result });
        }else{
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}s!`
        });
    }
}
myClass[`update${itemTopic}`] = async (req, res) => {
    let id =req.body.id;
    let body = req.body;

    try{
        let result = await Item.update( body,{ where: { id } });

        if (result) {
            return res.status(200).send({ result });
        }else{
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to update ${itemTopic}!`
        });
    }
}
myClass[`delete${itemTopic}`] = async (req, res) => {
    try{
        let id =req.body.id;
        let result = await Item.delete({ where: { id } });

        if (result) {
            return res.status(200).send({ result });
        }else{
            return res.status(500).send({ result: null });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to delete ${itemTopic}!`
        });
    }
}

myClass[`verify${itemTopic}`] = async (req, res) => {
    const userLoginCount = await Item.update(
        {
            verified: 1,
            verifiedDate: datetime
        },{
            where: {
                id: req.body.id,
            },
        }
    );
    if (!userLoginCount) {
        console.log('Login Count did not count');
    }

    const user = await Item.findOne({
        where: {
            id: req.body.id,
        },
    });

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
            profile_img: user.profile_img,
            roles: authorities,
            tna: user.tna,
            verified: user.verified,
            token: req.session.token
        });

}
myClass.requestPassword = async (req, res) => {
    let user = await Item.findOne({
        where: {
            email: req.body.email
        }
    });

    // sendmail
    let mailObj = requestPassword(user.id, user.email, user.username);
    sendMailOut(user.email, mailObj.subject, mailObj.plainText, mailObj.template);

    return true;

}

module.exports = myClass;