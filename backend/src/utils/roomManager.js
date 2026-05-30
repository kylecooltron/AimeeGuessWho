const Room = require("../models/Room");

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    createRoom(roomCode, adminId) {
        if (this.rooms.has(roomCode)) {
            return null; // Room already exists
        }
        const room = new Room(roomCode, adminId);
        this.rooms.set(roomCode, room);
        return room;
    }

    getRoom(roomCode) {
        return this.rooms.get(roomCode);
    }

    deleteRoom(roomCode) {
        this.rooms.delete(roomCode);
    }

    roomExists(roomCode) {
        return this.rooms.has(roomCode);
    }

    generateRoomCode() {
        // Simple 6-character code (can be improved)
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
}

module.exports = new RoomManager();
