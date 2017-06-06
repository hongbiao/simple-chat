// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

function getUsers(connectedSockets){
  return Object.keys(connectedSockets).map(socketId => ({
        'username': connectedSockets[socketId].username,
        'avatar': connectedSockets[socketId].avatar
      })).filter(socket => socket.username)
}

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      avatar: socket.avatar,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username, avatar) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    socket.avatar = avatar;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers,
      users: getUsers(io.sockets.connected)
    });
    // echo globally (all clients) that a person has connected
    console.log(io.sockets.connected);
    socket.broadcast.emit('user joined', {
      username: socket.username,
      avatar: socket.avatar,
      numUsers: numUsers,
      users: getUsers(io.sockets.connected)
     });
  });

socket.on('set avatar', function (avatar) {
    // we store the avatar in the socket session for this client
    socket.avatar = avatar;
  });
  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        avatar: socket.avatar,
        numUsers: numUsers,
        users: getUsers(io.sockets.connected)
      });
    }
  });
  socket.on('change avatar', function (avatarUrl) {
    console.log(avatarUrl + "**dfghjvnbgfdgxhjkdASGDJHAVDUTFrtfjgh");
    socket.avatar = avatarUrl;
    socket.broadcast.emit('change avatar', {username: socket.username, avatar: socket.avatar, users: getUsers(io.sockets.connected)});
  })
});