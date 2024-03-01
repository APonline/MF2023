//import dotenv from 'dotenv';
const dotenv = require('dotenv');
dotenv.config();

const deleteAccount = (verifyId, email, username) => {
    const subject = `Muse Factory Delete Account!`;
    const plainText = `
    ${username}, you are receiving this email because you have requested to delete your account.\n\n
    Are you Sure you want to delete your account?\n\n
    By clicking the button below, you will permanently delete your account.\n\n
    

    https://musefactory.app/user/deleteAccount?id=${verifyId}&email=${email}
    `;
    const template = `
    <!DOCTYPE html>
        <html>
            <head>
                <title>Welcome to</title>
                <style>
                    #mfEmail {
                        padding:40px;
                        background:url(https://musefactory.app/assets/images/loginbk.jpg);
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
                    <a id='logo' href='https://musefactory.app'><img width="260px" src="https://musefactory.app/assets/images/logo.png" /></a>
                    <br/>
                    <h1 style='color:#fff!important;'>Muse Factory</h1>
                    <h3 style='color:#fff!important;'>Delete Account</h3>
                    <p style='color:#fff!important;'>
                        ${username}, you are receiving this email because you have requested to delete your account.\n\n
                        Are you Sure you want to delete your account?\n\n
                        By clicking the button below, you will permanently delete your account.\n\n
                    </p>
                    <br/>
                    <br />
                    <a id='link' href='https://musefactory.app/user/deleteAccount?id=${verifyId}&email=${email}'>Delete Account</a>
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

export default deleteAccount;