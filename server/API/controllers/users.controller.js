const db = require("../models");
let p = require('path');
const scriptName = p.basename(__filename).split('.')[0];
let itemTopic = scriptName.charAt(0).toUpperCase() + scriptName.slice(1);
( itemTopic.substring(itemTopic.length - 1) == 's' ? itemTopic = itemTopic.slice(0, -1) : itemTopic = itemTopic);
let itemTitle = `${scriptName.slice(0, -1)}`;
const Item = db[itemTitle];

const fs = require('fs');
const jwt = require("jsonwebtoken");
const config = require("../../config/auth.config");
const bcrypt = require("bcryptjs");

const sendMailOut = require('../../mailserver');
const uniqueCredentials = require('../../mailTemplates/signup');
const deleteAccount = require('../../mailTemplates/deleteAccount');

let datetime = new Date();
let lastLogin =
datetime.getFullYear() + "-" +
("00" + (datetime.getMonth() + 1)).slice(-2) + "-" +
("00" + datetime.getDate()).slice(-2) + " " +
("00" + datetime.getHours()).slice(-2) + ":" +
("00" + datetime.getMinutes()).slice(-2) + ":" +
("00" + datetime.getSeconds()).slice(-2);

// exports.allAccess = (req, res) => { res.status(200).send("Public Content."); };
// exports.userBoard = (req, res) => { res.status(200).send("User Content."); }; 
// exports.adminBoard = (req, res) => { res.status(200).send("Admin Content."); };
// exports.moderatorBoard = (req, res) => { res.status(200).send("Moderator Content."); };

let myClass = {};

myClass[`get${itemTopic}`] = async (req, res) => {
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
myClass[`getAll${itemTopic}s`] = async (req, res) => {
    try{
        let result = await Item.findAll({ where: { active: 1, online: 1 } });

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
myClass[`update${itemTopic}`] = async (req, res) => {
    let id =req.body.id;
    let body = req.body;

    if(body['password']){
        body['password'] = bcrypt.hashSync(req.body.password, 8);
    }

    try{
        let result = await Item.update( body,{ where: { id } });

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
myClass[`delete${itemTopic}`] = async (req, res) => {
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
myClass[`verify${itemTopic}`] = async (req, res) => {
    const userLoginCount = await Item.update(
        {
            verified: 1,
            verifiedDate: lastLogin
        },{
            where: {
                id: req.params.id,
            },
        }
    );

    const user = await Item.findOne({
        where: {
            id: req.params.id,
        },
    });

    return res.status(200).send({
        id: user.id,
        verified: user.verified
    });

}
myClass[`tna${itemTopic}`] = async (req, res) => {
    const userLoginCount = await Item.update(
        {
            tna: 1,
            tnaDate: lastLogin
        },{
            where: {
                id: req.params.id,
            },
        }
    );

    const token = jwt.sign({ id: req.params.id }, config.secret, {
        expiresIn: 86400, // 24 hours
    });

    if (!userLoginCount) {
        console.log('Login Count did not count');
    }

    const user = await Item.findOne({
        where: {
            id: req.params.id,
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
        profile_image: user.profile_image,
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
myClass[`get${itemTopic}ChatHistoryWith`] = async (req, res) => {
    try{
        let group =req.params.group;
        let id =req.params.id;
        let chatee =req.params.chatee;

        const directoryPath = __basedir + "/resources/chats/";

        if(group != 'user'){
            fs.readFile(directoryPath+group+'.json', "utf8", (err, data) => {
                if (!err && data) {
                    return res.status(200).send( {title: group+'.json', data: JSON.parse(data)} );
                }else{
                    let createStream = fs.createWriteStream(`${directoryPath}${group}.json`);
                    createStream.end();

                    let json = {msgs: []};
                    
                    fs.writeFile(`${directoryPath}${group}.json`, JSON.stringify(json), (err, data) => {
                        return res.status(200).send( {title: group+'.json', data: data} );
                    }) 
                }
            })
        }else{
            const forwards = id+"-"+chatee+".json";
            const backwards = chatee+"-"+id+".json";

            fs.readFile(directoryPath+forwards, "utf8", (err, data) => {
                if (!err && data) {
                    return res.status(200).send( {title: forwards, data: JSON.parse(data)} );
                }else{
                    fs.readFile(directoryPath+backwards, (err, data) => {
                        if (!err && data) {
                            return res.status(200).send( {title: backwards, data: JSON.parse(data)} );
                        }else{
                            let createStream = fs.createWriteStream(`${directoryPath}${forwards}`);
                            createStream.end();

                            let json = {msgs: []};
                    
                            fs.writeFile(directoryPath+forwards, JSON.stringify(json), (err, data) => {
                                return res.status(200).send( {title: forwards, data: data} );
                            }) 
                        }
                    })
                }
            })
        }
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}!`
        });
    }
}
myClass[`update${itemTopic}ChatHistoryWith`] = async (req, res) => {
    try{
        let id =req.params.id;
        let chatee =req.params.chatee;
        let group =req.params.group;
        let file = req.body.file.slice(5);
        let msg = req.body.msg;

        if(group != 'user')
            file = group+'.json';
        
        const directoryPath = __basedir + "/resources/chats/";

        fs.readFile(directoryPath+file, "utf8", (err, data) => {
            if (!err) {
                let json;
                if(data!=''&&data!=undefined&&data!=null){
                    json = JSON.parse(data);
                    json.msgs.push(msg);
                }else{
                    json = {msgs: []};
                    json.msgs.push(msg);
                }
            
                fs.writeFile(directoryPath+file, JSON.stringify(json), (err, data) => {
                    return res.status(200).send( {title: file, data: data} );
                }) 
            }
            
        })
    } catch (error) {
        return res.status(500).send({
            message: `Unable to get ${itemTopic}!`
        });
    }
}

module.exports = myClass;