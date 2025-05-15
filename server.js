const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const roomTexts = {};
const roomCleanupTimers = {};

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('join-room', (roomId) => {
    if (currentRoom && currentRoom !== roomId) {
      socket.leave(currentRoom);
    }

    currentRoom = roomId;
    socket.join(roomId);

    if (!roomTexts[roomId]) {
      roomTexts[roomId] = '';
    }

    if (roomCleanupTimers[roomId]) {
      clearTimeout(roomCleanupTimers[roomId]);
      delete roomCleanupTimers[roomId];
      console.log(`已取消房间 ${roomId} 的清理定时器`);
    }

    socket.emit('init-text', {
      text: roomTexts[roomId]
    });

    console.log(`用户加入房间 ${roomId}`);
    const room = io.sockets.adapter.rooms.get(roomId);
    const roomSize = room ? room.size : 0;
    console.log(`房间 ${roomId} 当前连接人数: ${roomSize}`);
  });

  socket.on('text-update', (data) => {
    const { text, userId } = data;
    
    if (!currentRoom) return;

    roomTexts[currentRoom] = text;

    socket.to(currentRoom).emit('text-update', {
      text,
      userId
    });

    console.log(`房间 ${currentRoom} 收到用户 ${userId} 的新文本`);
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      setTimeout(() => {
        const room = io.sockets.adapter.rooms.get(currentRoom);
        if (!room || room.size === 0) {
          roomCleanupTimers[currentRoom] = setTimeout(() => {
            delete roomTexts[currentRoom];
            delete roomCleanupTimers[currentRoom];
            console.log(`房间 ${currentRoom} 超时无人，已清理`);
          }, 5 * 60 * 1000);
          console.log(`房间 ${currentRoom} 无人，5分钟后将清理`);
        }
      }, 100);
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
