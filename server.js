const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Initial game state
let gameState = {
  settings: {
    gameTitle: 'Quiz Battle',
    numberOfTeams: 3,
    questionsPerRound: 10,
    timerDuration: 60
  },
  teams: [
    {
      id: 'team-1',
      name: 'Vanguard',
      icon: '🛡️',
      points: 380
    },
    {
      id: 'team-2',
      name: 'Brainiacs',
      icon: '💡',
      points: 470
    },
    {
      id: 'team-3',
      name: 'Nova',
      icon: '🚀',
      points: 360
    }
  ]
};

// Handle Socket.io connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send the initial state to the newly connected client
  socket.emit('state_update', gameState);

  // Add a new team
  socket.on('add_team', (team) => {
    const newTeam = {
      id: `team-${Date.now()}`,
      name: team.name || 'New Team',
      icon: team.icon || '🛡️',
      points: team.points || 0
    };
    gameState.teams.push(newTeam);
    io.emit('state_update', gameState);
  });

  // Update an existing team (name, icon, or points)
  socket.on('update_team', (updatedTeam) => {
    gameState.teams = gameState.teams.map(team => 
      team.id === updatedTeam.id ? { ...team, ...updatedTeam } : team
    );
    io.emit('state_update', gameState);
  });

  // Delete a team
  socket.on('delete_team', (teamId) => {
    gameState.teams = gameState.teams.filter(team => team.id !== teamId);
    io.emit('state_update', gameState);
  });

  // Reset scores for all teams
  socket.on('reset_scores', () => {
    gameState.teams = gameState.teams.map(team => ({
      ...team,
      points: 0
    }));
    io.emit('state_update', gameState);
  });

  // Update game settings
  socket.on('update_settings', (settings) => {
    gameState.settings = { ...gameState.settings, ...settings };
    io.emit('state_update', gameState);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
