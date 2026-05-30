const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");
require("dotenv").config();

const Room = require("./models/Room");
const roomManager = require("./utils/roomManager");

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 8080;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
}));
app.use(express.json());

// Track WebSocket connections per room and player
const playerConnections = new Map(); // playerId -> ws connection
const roomConnections = new Map(); // roomCode -> Set of playerId's
const playerRooms = new Map(); // playerId -> roomCode

// WebSocket server — attached to HTTP server so both share one port on Render
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
    console.log("New WebSocket connection");
    let playerId = null;
    let roomCode = null;

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data, playerId, roomCode, (id) => {
                playerId = id;
            }, (code) => {
                roomCode = code;
                if (!roomConnections.has(code)) {
                    roomConnections.set(code, new Set());
                }
                roomConnections.get(code).add(playerId);
                playerConnections.set(playerId, ws);
            });
        } catch (error) {
            console.error("Failed to parse message:", error);
        }
    });

    ws.on("close", () => {
        console.log("WebSocket connection closed");
        if (playerId && roomCode) {
            const room = roomManager.getRoom(roomCode);
            if (room) {
                const wasAdmin = room.adminId === playerId;
                room.removePlayer(playerId);
                playerConnections.delete(playerId);
                playerRooms.delete(playerId);
                roomConnections.get(roomCode).delete(playerId);

                if (wasAdmin) {
                    // Admin left — destroy room and kick everyone
                    broadcastToRoom(roomCode, { type: "ROOM_DESTROYED", payload: {} });
                    roomManager.deleteRoom(roomCode);
                    roomConnections.delete(roomCode);
                } else if (roomConnections.get(roomCode).size === 0) {
                    roomManager.deleteRoom(roomCode);
                    roomConnections.delete(roomCode);
                } else {
                    broadcastToRoom(roomCode, {
                        type: "PLAYER_LEFT",
                        payload: { players: room.getGameState().players },
                    });
                }
            }
        }
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});

function handleMessage(ws, data, playerId, roomCode, setPlayerId, setRoomCode) {
    const { type, roomCode: dataRoomCode, payload } = data;
    const actualRoomCode = roomCode || dataRoomCode;
    console.log(`Received message type: ${type} in room: ${dataRoomCode || roomCode}`);

    switch (type) {
        case "CREATE_ROOM":
            handleCreateRoom(ws, actualRoomCode, payload, setPlayerId, setRoomCode);
            break;
        case "JOIN_ROOM":
            handleJoinRoom(ws, actualRoomCode, payload, setPlayerId, setRoomCode);
            break;
        case "ADD_NAME":
            handleAddName(actualRoomCode, payload);
            break;
        case "REMOVE_NAME":
            handleRemoveName(actualRoomCode, payload);
            break;
        case "START_GAME":
            handleStartGame(actualRoomCode, payload);
            break;
        case "RULE_OUT_NAME":
            handleRuleOutName(actualRoomCode, payload, playerId);
            break;
        case "DESTROY_ROOM":
            handleDestroyRoom(actualRoomCode);
            break;
        case "END_GAME":
            handleEndGame(actualRoomCode);
            break;
        case "RESTART_GAME":
            handleRestartGame(actualRoomCode);
            break;
        case "MAKE_GUESS":
            handleMakeGuess(actualRoomCode, playerId);
            break;
        case "DISMISS_GUESS":
            handleDismissGuess(actualRoomCode, payload);
            break;
        case "DECLARE_WINNER":
            handleDeclareWinner(actualRoomCode, payload);
            break;
    }
}

function handleCreateRoom(ws, roomCode, payload, setPlayerId, setRoomCode) {
    const { adminId, adminName } = payload;

    // Server generates the room code to avoid stale client-side codes
    let code;
    do {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (roomManager.roomExists(code));

    const room = roomManager.createRoom(code, adminId);

    room.addPlayer(adminId, adminName);

    setPlayerId(adminId);
    setRoomCode(code);

    ws.send(
        JSON.stringify({
            type: "ROOM_CREATED",
            payload: { roomCode: code, players: room.getGameState().players },
        }),
    );

    console.log(`Room ${code} created by ${adminName}`);
}

function handleJoinRoom(ws, roomCode, payload, setPlayerId, setRoomCode) {
    const { targetRoomCode, playerId, playerName } = payload;
    const code = targetRoomCode || roomCode;

    const room = roomManager.getRoom(code);
    if (!room) {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Room not found" } }));
        return;
    }

    // Add player to room
    room.addPlayer(playerId, playerName);

    setPlayerId(playerId);
    setRoomCode(code);

    // Confirm join
    ws.send(
        JSON.stringify({
            type: "ROOM_JOINED",
            payload: { roomCode: code, players: room.getGameState().players },
        }),
    );

    // Broadcast updated player list to all players in room
    broadcastToRoom(code, {
        type: "PLAYERS_UPDATED",
        payload: { players: room.getGameState().players },
    });

    console.log(`${playerName} joined room ${code}`);
}

function handleAddName(roomCode, payload) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const { name } = payload;
    room.addName(name);

    broadcastToRoom(roomCode, {
        type: "NAMES_UPDATED",
        payload: { names: room.names },
    });
}

function handleRemoveName(roomCode, payload) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const { index } = payload;
    room.names.splice(index, 1);

    broadcastToRoom(roomCode, {
        type: "NAMES_UPDATED",
        payload: { names: room.names },
    });
}

function handleStartGame(roomCode, payload) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    room.gameState = "in_progress";
    room.eliminateOnWrongGuess = payload.eliminateOnWrongGuess || false;

    const nameIndex = Math.floor(Math.random() * room.names.length);
    room.selectedName = room.names[nameIndex];

    // Select random player to be "it"
    const playerIds = Array.from(room.players.keys());
    const selectedPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];
    room.selectedPlayerName = selectedPlayerId;

    // Send different payloads to host vs other players
    const selectedPlayer = room.players.get(selectedPlayerId);
    
    roomConnections.get(roomCode).forEach((pid) => {
        const connection = playerConnections.get(pid);
        if (connection && connection.readyState === WebSocket.OPEN) {
            if (pid === selectedPlayerId) {
                // Send the assigned name to the selected player
                connection.send(
                    JSON.stringify({
                        type: "GAME_STARTED",
                        payload: {
                            selectedPlayerId: pid,
                            assignedName: room.selectedName,
                            names: room.names,
                            gameState: "in_progress",
                            players: room.getGameState().players,
                            isAssigned: true,
                            eliminateOnWrongGuess: room.eliminateOnWrongGuess,
                        },
                    }),
                );
            } else {
                // Send names list to other players (no assigned name)
                connection.send(
                    JSON.stringify({
                        type: "GAME_STARTED",
                        payload: {
                            selectedPlayerId: selectedPlayerId,
                            assignedName: null,
                            names: room.names,
                            gameState: "in_progress",
                            players: room.getGameState().players,
                            isAssigned: false,
                            eliminateOnWrongGuess: room.eliminateOnWrongGuess,
                        },
                    }),
                );
            }
        }
    });
}

function handleRuleOutName(roomCode, payload, playerId) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const { nameIndex } = payload;
    room.markNameAsRuledOut(playerId, nameIndex);

    broadcastToRoom(roomCode, {
        type: "NAME_RULED_OUT",
        payload: { playerId, nameIndex },
    });
}

function handleRestartGame(roomCode) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    room.ruledOut = new Map();

    const nameIndex = Math.floor(Math.random() * room.names.length);
    room.selectedName = room.names[nameIndex];

    const playerIds = Array.from(room.players.keys());
    const selectedPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];
    room.selectedPlayerName = selectedPlayerId;

    roomConnections.get(roomCode).forEach((pid) => {
        const connection = playerConnections.get(pid);
        if (connection && connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify({
                type: "GAME_RESTARTED",
                payload: {
                    selectedPlayerId,
                    assignedName: pid === selectedPlayerId ? room.selectedName : null,
                    names: room.names,
                    players: room.getGameState().players,
                    isAssigned: pid === selectedPlayerId,
                    eliminateOnWrongGuess: room.eliminateOnWrongGuess,
                },
            }));
        }
    });
}

function handleDestroyRoom(roomCode) {
    broadcastToRoom(roomCode, { type: "ROOM_DESTROYED", payload: {} });
    roomManager.deleteRoom(roomCode);
    roomConnections.delete(roomCode);
}

function handleEndGame(roomCode) {
    broadcastToRoom(roomCode, { type: "GAME_ENDED", payload: {} });
    roomManager.deleteRoom(roomCode);
    roomConnections.delete(roomCode);
}

function handleMakeGuess(roomCode, playerId) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    const player = room.players.get(playerId);
    if (!player) return;
    broadcastToRoom(roomCode, {
        type: "PLAYER_GUESSING",
        payload: { playerId, playerName: player.name },
    });
}

function handleDismissGuess(roomCode, payload) {
    const broadcastPayload = {};
    if (payload.eliminate && payload.playerId) {
        broadcastPayload.eliminatedPlayerId = payload.playerId;
        broadcastPayload.eliminatedPlayerName = payload.playerName;
    }
    broadcastToRoom(roomCode, { type: "GUESS_DISMISSED", payload: broadcastPayload });
}

function handleDeclareWinner(roomCode, payload) {
    broadcastToRoom(roomCode, {
        type: "WINNER_DECLARED",
        payload: { winnerName: payload.winnerName },
    });
}

function broadcastToRoom(roomCode, message) {
    const playerIds = roomConnections.get(roomCode);
    if (!playerIds) return;

    playerIds.forEach((playerId) => {
        const connection = playerConnections.get(playerId);
        if (connection && connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify(message));
        }
    });
}

// REST API endpoints
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (HTTP + WebSocket)`);
});
