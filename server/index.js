const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const qs = require('qs');
const axios = require('axios');

global.__basedir = __dirname;
global.baseUrl = "http://localhost:3000";

// db
const db = require("./API/models");

db.sequelize.options.logging = false;
//db.sequelize.sync();

// app server
const app = express();

app.use(cors());

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
const io = require('socket.io')(http, {
  cors: {
    origins: [
        "http://localhost:3001",
        "http://localhost:3000",
        "http://localhost:4200",
        "http://localhost:8080",
        "https://musefactory.app",
    ],
  }
});

require("./API/routes")(app);

// ---all routes
app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});


// SOCKETING
app.get('/', (req, res) => {
    res.send('<h1>Hey Socket.io</h1>');
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    console.log('token', token);
    next();
});



let onlineUsers = [];
  
io.on('connection', (socket) => {
  let user = socket.handshake.auth.user;
  if(user != null){
    if (!onlineUsers.some((u) => u.id === user.id)) { 
      user['socketId']=socket.id;
      onlineUsers.push(user);
      console.log(`${user.username} connected`);
      updateOnlineStatus(user, 1);
      updateOnlineUsers();
    }
    // send all active users to new user
    io.emit("get-users", onlineUsers);
  
    socket.on('disconnect', () => {
      onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
      console.log(`${user.username} disconnected`);
      updateOnlineStatus(user, 0);
      io.emit("get-users", onlineUsers);
    });
  
    socket.on("offline", () => {
      onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
      console.log(`${user.username}disconnected`);
      updateOnlineStatus(user, 0);
      io.emit("get-users", onlineUsers);
    });
  
    socket.on('my message', (msg) => {
        io.emit('my broadcast', `server: ${msg}`);
    });
  }
});

// setonline status
let updateOnlineStatus = (user, status) => {
  user['online'] = status;
  axios.put(`http://localhost:3000/api/v1/users/online/${user.id}`,
    qs.stringify(user))
    .then( (response) => {
      if(status == 1) {
        console.log(`${user.username} logged online...`);
      }else{
        console.log(`${user.username} logged offline...`);
      }
    })
    .catch( (error) => {
      console.log(`error with ${user.username} logging online status...`);
    });
};

let updateOnlineUsers = () => {
  axios.get(`http://localhost:3000/api/v1/users`)
    .then( (response) => {
      return response;
    })
    .catch( (error) => {
      console.log(`error with ${user.username} logging online status...`);
    });
};
// SOCKETING
  
http.listen(3000, () => {
    console.log('listening on *:3000');
});