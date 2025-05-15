const socket = io();
let textarea = null;
let currentRoom = null;
const userId = generateUserId(); // 本地生成用户 ID

// 页面加载时尝试恢复房间状态
window.onload = () => {
  const savedRoom = localStorage.getItem('roomId');
  if (savedRoom) {
    document.getElementById('roomInput').value = savedRoom;
    joinRoom(savedRoom);
  }
};

function joinRoom(roomIdFromStorage = null) {
  const roomId = roomIdFromStorage || document.getElementById('roomInput').value.trim();
  if (!roomId) return;

  currentRoom = roomId;
  localStorage.setItem('roomId', roomId);

  document.getElementById('entry').classList.add('hidden');
  document.getElementById('editor').classList.remove('hidden');

  socket.emit('join-room', roomId);

  textarea = document.getElementById('sharedText');

  // 避免重复绑定 input 事件
  textarea.removeEventListener('input', handleInput);
  textarea.addEventListener('input', handleInput);

  // 初始化监听
  socket.off('init-text');
  socket.on('init-text', ({ text }) => {
    textarea.value = text || '';
  });

  socket.off('text-update');
  socket.on('text-update', ({ text, userId: senderId }) => {
      textarea.value = text;
  });
}

function handleInput() {
  const text = textarea.value;

  socket.emit('text-update', {
    text,
    userId,
  });
}

function leaveRoom() {
  socket.emit('leave-room');
  currentRoom = null;
  localStorage.removeItem('roomId');

  document.getElementById('editor').classList.add('hidden');
  document.getElementById('entry').classList.remove('hidden');
  document.getElementById('roomInput').value = '';
  document.getElementById('sharedText').value = '';
}

// 生成简单唯一 ID（可更换为真实身份）
function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 8);
}
