import React from 'react';
import { useNavigate } from 'react-router-dom';
import { extractTime } from './utils/extractTime';

const ChatBody = ({ messages, lastMessageRef, typingStatus, socket }) => {
  const navigate = useNavigate();
  const currentUserName = localStorage.getItem('userName');

  const handleLeaveChat = () => {
    // Explicitly tell server the user is logging out
    socket.emit('userLogout');
    localStorage.removeItem('userName');
    navigate('/');
    window.location.reload();
  };

  const handleClearChat = () => {
    localStorage.removeItem('chatMessages');
    window.location.reload();
  };

  return (
    <>
      <header className="chat__mainHeader">
        <p>Chat with Friends</p>
        <div className="header-buttons">
          <button className="clearChat__btn" onClick={handleClearChat}>
            CLEAR CHAT
          </button>
          <button className="leaveChat__btn" onClick={handleLeaveChat}>
            LEAVE CHAT
          </button>
        </div>
      </header>

      <div className="message__container">
        {messages.length > 0 ? (
          messages.map((message) => {
            const fromMe = message.name === currentUserName;
            const shakeClass = message.shouldShake && !fromMe ? "shake" : "";
            const messageTime = message.time ? extractTime(message.time) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div className={`message__chats ${fromMe ? 'from-me' : 'from-them'} ${shakeClass}`} key={message.id}>
                <div className={`message__bubble ${fromMe ? 'me' : 'them'}`}>
                  <p>{message.text}</p>
                  <span className="message-time">{messageTime}</span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-messages">No messages yet. Start the conversation!</p>
        )}
        <div className="message__status">
          <p>{typingStatus}</p>
        </div>
        <div ref={lastMessageRef} />
      </div>
    </>
  );
};

export default ChatBody;