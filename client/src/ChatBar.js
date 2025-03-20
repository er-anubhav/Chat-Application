import React, { useState, useEffect } from 'react';

const ChatBar = ({ socket }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const signalActivity = () => {
      const userName = localStorage.getItem('userName');
      if (userName) {
        socket.emit('userActivity', { userName, socketID: socket.id });
      }
    };
    signalActivity();
    socket.on('connect', signalActivity);
    const heartbeatInterval = setInterval(signalActivity, 30000);
    socket.on('newUserResponse', (data) => {
      setUsers(data);
    });
    return () => {
      socket.off('newUserResponse');
      socket.off('connect', signalActivity);
      clearInterval(heartbeatInterval);
    };
  }, [socket]);

  return (
    <div className="chat__sidebar">
      <h2>Open Chat</h2>
      <div>
        <h4 className="chat__header">ACTIVE USERS ({users.length})</h4>
        <div className="chat__users">
          {users.length > 0 ? (
            users.map((user) => (
              <div key={user.socketID} className="active-user">
                <p>{user.userName}</p>
                <span className="active-indicator"></span>
              </div>
            ))
          ) : (
            <p>No active users</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBar;