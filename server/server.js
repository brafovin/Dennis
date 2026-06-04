const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const rooms = new Map();

// ─── Room logic ───────────────────────────────────────────────────────────────

function createRoom(mode) {
  const id = Math.random().toString(36).slice(2, 8).toUpperCase();
  const maxPlayers = mode === '1v1' ? 2 : mode === '2v2' ? 4 : 6;
  rooms.set(id, {
    id,
    mode,
    maxPlayers,
    players: [],
    state: 'waiting',
    score: [0, 0],
    createdAt: Date.now(),
  });
  return id;
}

function assignTeam(room) {
  const t0 = room.players.filter(p => p.team === 0).length;
  const t1 = room.players.filter(p => p.team === 1).length;
  const teamSize = room.maxPlayers / 2;
  if (t0 < teamSize) return 0;
  if (t1 < teamSize) return 1;
  return -1;
}

function findOrCreateRoom(mode) {
  for (const [id, room] of rooms) {
    if (room.mode === mode && room.state === 'waiting' && room.players.length < room.maxPlayers) {
      return id;
    }
  }
  return createRoom(mode);
}

// ─── Socket events ────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  let currentRoom = null;

  socket.on('findMatch', ({ mode, playerData }) => {
    const roomId = findOrCreateRoom(mode || '1v1');
    const room = rooms.get(roomId);
    if (!room) return;

    const team = assignTeam(room);
    if (team === -1) {
      socket.emit('error', 'Room full');
      return;
    }

    const playerEntry = {
      id: socket.id,
      team,
      name: playerData?.name || 'Player',
      number: playerData?.number || 23,
      position: { x: team === 0 ? -5 : 5, z: 0 },
      rotation: 0,
      hasBall: false,
    };

    room.players.push(playerEntry);
    currentRoom = roomId;
    socket.join(roomId);

    socket.emit('joinedRoom', { roomId, team, playerId: socket.id, players: room.players });
    socket.to(roomId).emit('playerJoined', { player: playerEntry, players: room.players });

    console.log(`Player ${socket.id} joined room ${roomId} as team ${team}`);

    if (room.players.length === room.maxPlayers) {
      room.state = 'playing';
      io.to(roomId).emit('gameStart', { players: room.players, mode: room.mode });
      console.log(`Room ${roomId} game started`);
    }
  });

  socket.on('playerMove', (data) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
      player.velocity = data.velocity;
      player.hasBall = data.hasBall;
    }

    socket.to(currentRoom).emit('playerMoved', {
      id: socket.id,
      position: data.position,
      rotation: data.rotation,
      velocity: data.velocity,
      hasBall: data.hasBall,
    });
  });

  socket.on('ballShot', (data) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('ballShot', { ...data, shooterId: socket.id });
  });

  socket.on('basketScored', (data) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    room.score[data.team] += data.points;
    io.to(currentRoom).emit('scoreUpdate', {
      score: room.score,
      team: data.team,
      points: data.points,
      isThree: data.isThree,
    });
  });

  socket.on('passBall', (data) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('ballPassed', { ...data, fromId: socket.id });
  });

  socket.on('leaveRoom', () => {
    if (!currentRoom) return;
    handleLeave(socket, currentRoom);
    currentRoom = null;
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    if (currentRoom) {
      handleLeave(socket, currentRoom);
    }
  });

  function handleLeave(socket, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);
    socket.to(roomId).emit('playerLeft', { id: socket.id, players: room.players });

    if (room.players.length === 0) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} deleted`);
    } else if (room.state === 'playing') {
      room.state = 'waiting';
      io.to(roomId).emit('gamePaused', { reason: 'player_left' });
    }

    socket.leave(roomId);
  }

  socket.on('ping', () => socket.emit('pong'));
});

// ─── Cleanup old rooms ────────────────────────────────────────────────────────

setInterval(() => {
  const cutoff = Date.now() - 1000 * 60 * 30;
  for (const [id, room] of rooms) {
    if (room.createdAt < cutoff && room.players.length === 0) {
      rooms.delete(id);
    }
  }
}, 60000);

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Basketball server running on port ${PORT}`);
});
