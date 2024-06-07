//import dotenv from 'dotenv';
const dotenv = require('dotenv');
dotenv.config();

const inviteUser = (email, who, group) => {
    const subject = `Muse Factory Invite!`;
    const plainText = `
    Hey, you've been invited by ${who} to join Muse Factory. ${group} is waiting to collaborate with you.
    You can sign up at the link below.\n\n

    https://musefactory.app/register
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
                    <a id='logo' href='https://musefactory.app' target='_new'><img width="307" height="56" alt="logo" title="logo" src="cid:logo1" /></a>
                    <br/>
                    <h1 style='color:#fff!important;'>Muse Factory</h1>
                    <h3 style='color:#fff!important;'>Muse Factory Invite!</h3>
                    <p style='color:#fff!important;'>
                        Hey, you've been invited by ${who} to join Muse Factory. ${group} is waiting to collaborate with you.
                        You can sign up at the link below.
                    </p>
                    <br/>
                    <br />
                    <a id='link' href='https://musefactory.app/register'>Sign Up</a>
                    <br/>
                    <br/>
                    <br/>
                    <br/>
                    <a id='logo2' href='https://musefactory.app' target='_new'><img width="100" height="100" alt="logo" title="logo" src="cid:intrologo" /></a>
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

module.exports = inviteUser;