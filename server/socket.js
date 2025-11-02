const qs = require('qs');
const axios = require('axios');

let datetime = new Date();
let date =
datetime.getFullYear() + "-" +
("00" + (datetime.getMonth() + 1)).slice(-2) + "-" +
("00" + datetime.getDate()).slice(-2);

let time = new Date();
time = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })

// SOCKETING
module.exports = function(io, hostname) {

    let domainpath = '';

    //if(hostname == 'AP74.local'){
        domainpath = 'https://musefactory.app';
    //}else{
    //    domainpath = 'http://127.0.0.1';
    //}
    
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        next();
    });
    
    let onlineUsers = [];
        
    io.on('connection', (socket) => {
        let token = socket.handshake.auth.token;
        if(token == 'users'){
            let user = socket.handshake.auth.user;
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
        }else{
            let group = socket.handshake.auth.group;
            let userId = socket.handshake.auth.userId;
            let username = socket.handshake.auth.username;
            let userImg = socket.handshake.auth.userImg;
            let chatee = socket.handshake.auth.chatee;
            let convo = socket.handshake.auth.token;

            if(userId != null){
                socket.on('isTyping', (msg) => {
                    io.emit('userIsTyping', {group, userId, chatee, convo, msg});
                });

                socket.on('hasTyped', (msg) => {
                    let newMsg = {
                        "userId": userId,
                        "username": username,
                        "userImg": userImg,
                        "body": msg,
                        "date": date,
                        "time": time,
                        "attachmentUrl":"",
                        "attachmentPreview":""
                    }
                    io.emit('userHasTyped', {group, userId, chatee, convo, msg: newMsg});
                });
            }
        }
    });
    
    // setonline status
    let updateOnlineStatus = (user, status) => {
        if(user){
            user['online'] = status;
            axios.put(`${domainpath}/api/v1/users/online/${user.id}`,
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
        }
    };
    
    let updateOnlineUsers = (user) => {
        if(user){
            axios.get(`${domainpath}/api/v1/users`)
            .then( (response) => {
                return response;
            })
            .catch( (error) => {
                console.log(`error with ${user.username} logging online status...`);
            });
        }
    };
}
// SOCKETING