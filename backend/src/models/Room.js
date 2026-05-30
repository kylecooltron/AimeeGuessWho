// Room model for managing game sessions
class Room {
    constructor(code, adminId) {
        this.code = code;
        this.adminId = adminId;
        this.players = new Map(); // playerId -> player data
        this.names = []; // names pot
        this.selectedName = null;
        this.selectedPlayerName = null; // who is currently "it"
        this.gameState = "lobby"; // 'lobby', 'names_entry', 'in_progress', 'finished'
        this.ruledOut = new Map(); // playerId -> Set of ruled out indices
    }

    addPlayer(playerId, playerName) {
        this.players.set(playerId, {
            id: playerId,
            name: playerName,
            isAdmin: playerId === this.adminId,
        });
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        this.ruledOut.delete(playerId);
    }

    addName(name) {
        this.names.push(name);
    }

    removeAllNames() {
        this.names = [];
    }

    selectRandomName() {
        if (this.names.length === 0) return null;
        const index = Math.floor(Math.random() * this.names.length);
        this.selectedName = this.names[index];
        return this.selectedName;
    }

    assignNameToPlayer(playerId) {
        this.selectedPlayerName = playerId;
    }

    markNameAsRuledOut(playerId, nameIndex) {
        if (!this.ruledOut.has(playerId)) {
            this.ruledOut.set(playerId, new Set());
        }
        this.ruledOut.get(playerId).add(nameIndex);
    }

    getGameState() {
        return {
            code: this.code,
            players: Array.from(this.players.values()),
            names: this.names,
            selectedName: this.selectedName,
            selectedPlayerName: this.selectedPlayerName,
            gameState: this.gameState,
            ruledOut: this.ruledOut,
        };
    }
}

module.exports = Room;
