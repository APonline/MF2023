//import dotenv from 'dotenv';
const dotenv = require('dotenv');
dotenv.config();

const requestPassword = (verifyId, email, username) => {
    const subject = `Muse Factory Reset Password!`;
    const plainText = `
    ${username}, you are receiving this email because a password reset was requested.\n\n
    If you did not request this then please ignore this email.

    https://musefactory.app/user/passwordReset?id=${verifyId}&email=${email}
    `;
    const template = `
    <!DOCTYPE html>
        <html>
            <head>
                <title>Welcome to</title>
                <style>
                    body{
                        background-color:#000!important;
                    }
                    #mfEmail {
                        background-color:#000;
                        padding:40px;
                        background-image:url('cid:loginbk');
                        background-size:cover;
                        color:#fff!important;
                    }
                    #link {
                        text-decoration:none;
                        padding:10px 8px;
                        cursor:pointer;
                        border-radius:5px;
                        background-color:red;
                        color:#fff;
                        -moz-box-shadow: 0px 0px 6px #000000;
                        -webkit-box-shadow: 0px 0px 6px #000000;
                        box-shadow: 0px 0px 6px #000000;
                    }
                    #logo, #logo2 {
                        display:block;
                        margin:0 auto;
                        text-align:center;
                        width:100%;
                    }
                    img {
                        text-align:center;
                        cursor:pointer;
                    }
                </style>
            </head>
            <body>
                <div id="mfEmail">
                    <a id='logo' href='https://musefactory.app'><img width="307" height="56" alt="logo" title="logo" src="cid:logo1" /></a>
                    <br/>
                    <h1 style='color:#fff!important;'>Muse Factory</h1>
                    <h3 style='color:#fff!important;'>Password Reset Request</h3>
                    <p style='color:#fff!important;'>
                        ${username}, you are receiving this email because a password reset was requested.\n\n
                        If you did not request this then please ignore this email.
                    </p>
                    <br/>
                    <br />
                    <a id='link' href='https://musefactory.app/user/passwordReset?id=${verifyId}&email=${email}'>Change Password</a>
                    <br/>
                    <br/>
                    <br/>
                    <br/>
                    <a id='logo2' href='https://musefactory.app' target='_new'><img width="100px" src="https://musefactory.app/assets/images/intrologo.png" /></a>
                </div>
            </body>
        </html>
    `;

    const obj = {
        subject,
        plainText,
        template
    }
    return obj;
};

module.exports = requestPassword;