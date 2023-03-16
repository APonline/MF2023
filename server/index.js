const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");

// db
const db = require("./API/models");
const Role = db.role;

db.sequelize.options.logging = false;
db.sequelize.sync();

// app server
const app = express();

app.use(cors());

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));


app.use(
  cookieSession({
    name: "bezkoder-session",
    secret: "COOKIE_SECRET", // should use as secret environment variable
    httpOnly: true
  })
);

// routes
require('./API/routes/auth')(app);
require('./API/routes/user')(app);

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

app.get('/', (req, res) => {
    res.send('<h1>Hey Socket.io</h1>');
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    console.log('token', token);
    next();
});
  
io.on('connection', (socket) => {
    console.log('a user connected');
  
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('my message', (msg) => {
        io.emit('my broadcast', `server: ${msg}`);
    });
});
  
http.listen(3000, () => {
    console.log('listening on *:3000');
});