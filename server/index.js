const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
process.env.TZ = 'America/Toronto'

global.__basedir = __dirname;
//global.baseUrl = "https://musefactory.app";
global.baseUrl = "http://localhost:4200";
 
// db
const db = require("./API/models");

db.sequelize.options.logging = false;
//db.sequelize.sync();

// app server
const app = express();

app.use(cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.use(cors({
  origin: ['https://musefactory.app','https://musefactory.app:3001','http://localhost:4200']
}));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// yum cookies
app.use(
  cookieSession({
    name: "bezkoder-session",
    secret: "COOKIE_SECRET", // should use as secret environment variable
    httpOnly: true
  })
);

// simple route
const http = require('http').createServer(app);
require("./API/routes")(app);

// ---all routes
app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
    next();
});

//SOCKET
let os = require("os");
let hostname = os.hostname();

const io = require('socket.io')(http, {
  cors: {
    origins: [
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4200",
        "http://127.0.0.1:4001",
        "http://127.0.0.1:4000",
        "http://127.0.0.1:8080",
        "http://localhost:3001",
        "http://localhost:3000",
        "http://localhost:4200",
        "http://localhost:4001",
        "http://localhost:8080",
        "https://musefactory.app",
        "https://musefactory.app:4001",
        "https://musefactory.app:3001",
        "https://musefactory.app:4000",
    ],
  }
}, {secure: true});

require("./socket")(io, hostname);
//SOCKET

  
http.listen(4000, () => {
    console.log('listening on '+global.baseUrl+':4000');
});