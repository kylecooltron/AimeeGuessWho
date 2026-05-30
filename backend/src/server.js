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
app.use(cors());
app.use(express.json());

// Track WebSocket connections per room and player
const playerConnections = new Map(); // playerId -> ws connection
const roomConnections = new Map(); // roomCode -> Set of playerId's
const playerRooms = new Map(); // playerId -> roomCode

// WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });

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
                room.removePlayer(playerId);
                playerConnections.delete(playerId);
                playerRooms.delete(playerId);
                roomConnections.get(roomCode).delete(playerId);

                // Notify other players in room
                if (roomConnections.get(roomCode).size === 0) {
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
    console.log(`Received message type: ${type} in room: ${actualRoomCode}`);

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
    }
}

function handleCreateRoom(ws, roomCode, payload, setPlayerId, setRoomCode) {
    const { adminId, adminName } = payload;

    // Create room
    const room = roomManager.createRoom(roomCode, adminId);
    if (!room) {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Room already exists" } }));
        return;
    }

    // Add admin as first player
    room.addPlayer(adminId, adminName);

    setPlayerId(adminId);
    setRoomCode(roomCode);

    // Confirm room creation
    ws.send(
        JSON.stringify({
            type: "ROOM_CREATED",
            payload: { roomCode, players: room.getGameState().players },
        }),
    );

    console.log(`Room ${roomCode} created by ${adminName}`);
}

function handleJoinRoom(ws, roomCode, payload, setPlayerId, setRoomCode) {
    const { playerId, playerName } = payload;

    const room = roomManager.getRoom(roomCode);
    if (!room) {
        ws.send(JSON.stringify({ type: "ERROR", payload: { message: "Room not found" } }));
        return;
    }

    // Add player to room
    room.addPlayer(playerId, playerName);

    setPlayerId(playerId);
    setRoomCode(roomCode);

    // Confirm join
    ws.send(
        JSON.stringify({
            type: "ROOM_JOINED",
            payload: { roomCode, players: room.getGameState().players },
        }),
    );

    // Broadcast updated player list to all players in room
    broadcastToRoom(roomCode, {
        type: "PLAYERS_UPDATED",
        payload: { players: room.getGameState().players },
    });

    console.log(`${playerName} joined room ${roomCode}`);
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

// Start HTTP server (for future API endpoints)
app.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
    console.log(`WebSocket server running on port ${WS_PORT}`);
});
