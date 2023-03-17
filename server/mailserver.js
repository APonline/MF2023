import { createWriteStream, readFileSync } from 'fs';
import dotenv from 'dotenv';
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
            html: sendHtml
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

export default sendMailOut;