//import dotenv from 'dotenv';
const dotenv = require('dotenv');
dotenv.config();

const uniqueCredentials = (verifyId, email, username) => {
    const subject = `Muse Factory Registration Completed!`;
    const plainText = `
    Welcome to Muse Factory!\n\n
    ${username}, before we really get started you will need to verify your account.\n\n
    Now that you have joined the world of MuseFactory, we want you to strive to share your muse with the world. 
    We know ourselves that getting something that drives you off the ground is difficult. This is why you have 
    joined our platform and we hope we can help you along your creative journey. You'll find out quickly that 
    whatever you were doing before to keep track of everything was not cutting it! It is about time that there 
    is a true digital space to collect your ideas, as an individual or as a group, and work like the team you
    need to be. Back in the day, artists needed an agent or a manager. Not anymore! You have the network and 
    the tools in your hands, however you need it to work for you. So let's get started and verify your account
    and provide for you the digital factory your big ideas need to grow!\n\n
    Verify your account below with MuseFactory.\n\n
    https://musefactory.app/user/verify?id=${verifyId}&email=${email}
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
                    #verify {
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
                    <h1 style='color:#fff!important;'>Welcome to Muse Factory!</h1>
                    <h3 style='color:#fff!important;'>${username}, before we really get started you will need to verify your account.</h3>
                    <p style='color:#fff!important;'>
                    Now that you have joined the world of Muse Factory, we want you to strive to share your muse with the world. 
                    We know ourselves that getting something that drives you off the ground is difficult. This is why you have 
                    joined our platform and we hope we can help you along your creative journey. You'll find out quickly that 
                    whatever you were doing before to keep track of everything was not cutting it! It is about time that there 
                    is a true digital space to collect your ideas, as an individual or as a group, and work like the team you
                    need to be. Back in the day, artists needed an agent or a manager. Not anymore! You have the network and 
                    the tools in your hands, however you need it to work for you. So let's get started and verify your account
                    and provide for you the digital factory your big ideas need to grow!
                    </p>
                    <br/>
                    <p style='color:#fff!important;'>Verify your account below.</p>
                    <br/>
                    <a id='verify' href='https://musefactory.app/user/verify?id=${verifyId}&email=${email}&username=${username}'>Verify</a>
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

module.exports = uniqueCredentials; 