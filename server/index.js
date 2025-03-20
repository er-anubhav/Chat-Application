const express = require('express');
const app = express();
const PORT = 4000;

//New imports
const http = require('http').Server(app);
const cors = require('cors');

app.use(cors());

app.get('/api', (req, res) => {
  res.json({
    message: 'Hello world',
  });
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

//New imports
const socketIO = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000"
    }
});

let users = [];
// Track logged in status rather than just activity
const userActivity = new Map();
const userLoggedOut = new Map();

// Only check for inactive users if they've explicitly logged out
const checkInactiveUsers = () => {
  users.forEach(user => {
    if (userLoggedOut.get(user.socketID)) {
      // User has logged out, remove them
      users = users.filter(u => u.socketID !== user.socketID);
      userActivity.delete(user.socketID);
      userLoggedOut.delete(user.socketID);
    }
  });

  // Update clients with new user list
  if (socketIO) {
    socketIO.emit('newUserResponse', users);
  }
};

// Check less frequently, since we're now relying on explicit logout
setInterval(checkInactiveUsers, 60000);

socketIO.on('connection', (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);
  
  // Update user activity timestamp
  userActivity.set(socket.id, Date.now());
  
  socket.on('message', (data) => {
    socketIO.emit('messageResponse', data);
  });

  socket.on('typing', (data) => socket.broadcast.emit('typingResponse', data));

  // Add handler for stop typing event
  socket.on('stopTyping', () => {
    socket.broadcast.emit('typingResponse', '');
  });

  socket.on('userActivity', (data) => {
    // Mark user as active and remove from logged out if they reconnect
    userActivity.set(socket.id, Date.now());
    userLoggedOut.delete(socket.id);
    
    // Check if user is already in the list
    const userExists = users.some(user => user.socketID === socket.id);
    if (!userExists && data.userName) {
      // Add user to the list if they don't exist
      users.push({
        userName: data.userName,
        socketID: socket.id
      });
      socketIO.emit('newUserResponse', users);
    }
  });

  socket.on('userLogout', () => {
    // Mark user as logged out
    userLoggedOut.set(socket.id, true);
    users = users.filter((user) => user.socketID !== socket.id);
    socketIO.emit('newUserResponse', users);
  });

  //Listens when a new user joins the server
  socket.on('newUser', (data) => {
    //Adds the new user to the list of users
    users.push(data);
    // Add new user and set activity timestamp
    userActivity.set(socket.id, Date.now());
    // console.log(users);
    //Sends the list of users to the client
    socketIO.emit('newUserResponse', users);
  });

  socket.on('disconnect', () => {
    console.log('🔥: A user disconnected');
    
    // Store the user info before they might be removed
    const disconnectedUser = users.find(u => u.socketID === socket.id);
    
    // Don't immediately remove, use a longer timeout for page refreshes
    setTimeout(() => {
      // Check if this socket has reconnected (would have a new activity timestamp)
      const lastActivity = userActivity.get(socket.id);
      const hasReconnected = lastActivity && Date.now() - lastActivity < 5000;
      
      if (!hasReconnected && disconnectedUser) {
        // Only remove if they haven't explicitly logged out or reconnected
        if (!userLoggedOut.get(socket.id)) {
          console.log(`User ${disconnectedUser.userName} didn't reconnect, removing from active users`);
          users = users.filter(u => u.socketID !== socket.id);
          socketIO.emit('newUserResponse', users);
        }
      }
    }, 10000); // Give more time for page refreshes
  });
});