const db = require("../models");
const User = db.user;

import sendMailOut from '../../mailserver';
import requestPassword from '../../mailTemplates/requestPassword';
import deleteAccount from '../../mailTemplates/deleteAccount';

let datetime = new Date();

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

exports.verifyUser = async (req, res) => {

    const userLoginCount = await User.update(
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

    const user = await User.findOne({
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

exports.requestPassword = async (req, res) => {

    let user = await User.findOne({
        where: {
            email: req.body.email
        }
    });

    // sendmail
    let mailObj = requestPassword(user.id, user.email, user.username);
    sendMailOut(user.email, mailObj.subject, mailObj.plainText, mailObj.template);

    return true;

}

exports.delete = async (req, res) => {
    // Email
    let user = await User.delete({
        where: {
            id: req.body.id
        }
    });

    // sendmail
    let mailObj = deleteAccount(req.user.id, req.user.email, req.user.username);
    sendMailOut(req.user.email, mailObj.subject, mailObj.plainText, mailObj.template);

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