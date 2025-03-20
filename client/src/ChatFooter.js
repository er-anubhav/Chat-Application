import React, { useState, useEffect, useRef } from 'react';
import { getRandomEmoji } from './utils/emojis';

const ChatFooter = ({ socket }) => {
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const typingTimeoutRef = useRef(null);
  const emojiRef = useRef(null);

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing', `${localStorage.getItem('userName')} is typing`);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping');
    }, 2000);
  };

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
    setShowEmojis(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojis(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && localStorage.getItem('userName')) {
      const now = new Date();
      socket.emit('message', {
        text: message,
        name: localStorage.getItem('userName'),
        id: `${socket.id}${Math.random()}`,
        socketID: socket.id,
        time: now.toISOString(),
      });
      socket.emit('stopTyping');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
    setMessage('');
  };

  return (
    <div className="chat__footer">
      <form className="form" onSubmit={handleSendMessage}>
        <button type="button" className="emoji-btn" onClick={() => setShowEmojis(!showEmojis)}>
          😊
        </button>
        {showEmojis && (
          <div className="emoji-picker" ref={emojiRef}>
            {[...Array(8)].map((_, i) => (
              <span key={i} onClick={() => addEmoji(getRandomEmoji())} className="emoji-item">
                {getRandomEmoji()}
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          placeholder="Write message"
          className="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleTyping}
        />
        <button className="sendBtn">SEND</button>
      </form>
    </div>
  );
};

export default ChatFooter;