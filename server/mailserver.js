//import { createWriteStream, readFileSync } from 'fs';
const createWriteStream = require('fs');
const readFileSync = require('fs');
//import dotenv from 'dotenv';
const dotenv = require('dotenv');
dotenv.config();
const nodemailer = require('nodemailer');
const SMTPServer = require("smtp-server").SMTPServer;

let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    },
})

const sendMailOut = (sendTo, sendSubject, sendText, sendHtml) => {

    transporter.sendMail(
        { 
            from: '"MF" <noreply@musefactory.app>',
            to: sendTo,
            subject: sendSubject,
            text: sendText,
            html: sendHtml,
            attachments: [
                {
                    filename: 'logo1.png',
                    path: 'https://musefactory.app/assets/images/logo1.png',
                    cid: 'logo1' 
                },
                {
                    filename: 'intrologo.png',
                    path: 'https://musefactory.app/assets/images/intrologo.png',
                    cid: 'intrologo'
                },
                {
                    filename: 'loginbk.jpg',
                    path: 'https://musefactory.app/assets/images/loginbk.jpg',
                    cid: 'loginbk' 
                }
            ]
        }, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        }
    );
}
// MAIL ENDS

module.exports = sendMailOut;
