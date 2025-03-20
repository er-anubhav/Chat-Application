import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Chatpage from './Chatpage';
import socketIO from 'socket.io-client';

// Configure socket with reconnection options
const socket = socketIO.connect('http://localhost:4000', {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});

// Log connection status changes
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
  
  // Re-establish user status when reconnecting
  const userName = localStorage.getItem('userName');
  if (userName) {
    socket.emit('userActivity', { userName, socketID: socket.id });
  }
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

function App() {
  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path="/" element={<Home socket={socket} />}></Route>
          <Route path="/chat" element={<Chatpage socket={socket} />}></Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;