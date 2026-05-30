<template>
    <div class="lobby-container">
        <div class="lobby-card">
            <div class="room-info">
                <h2>Room Code</h2>
                <div class="code-display" @click="copyCode" :title="copied ? 'Copied!' : 'Click to copy'">
                    {{ gameStore.roomCode }}
                    <span class="copy-hint">{{ copied ? '✓ Copied!' : 'tap to copy' }}</span>
                </div>
            </div>

            <div class="players-section">
                <h3>Players ({{ gameStore.players.length }})</h3>
                <div class="players-list">
                    <div
                        v-for="player in gameStore.players"
                        :key="player.id"
                        class="player-item"
                        :class="{ admin: player.isAdmin }"
                    >
                        <span class="badge" v-if="player.isAdmin">👑 Admin</span>
                        <span>{{ player.name }}</span>
                    </div>
                </div>
            </div>

            <div v-if="gameStore.isAdmin" class="admin-section">
                <h3>Admin Panel</h3>
                <div class="admin-controls">
                    <div class="form-group">
                        <label for="name-input">Add Names to the Pot</label>
                        <div class="input-group">
                            <input
                                id="name-input"
                                v-model="newName"
                                type="text"
                                placeholder="Enter a name"
                                @keyup.enter="addName"
                            />
                            <button @click="addName" class="btn btn-primary">Add</button>
                        </div>
                    </div>

                    <div v-if="gameStore.names.length > 0" class="names-list">
                        <h4>Names in Pot ({{ gameStore.names.length }})</h4>
                        <div class="names-grid">
                            <div v-for="(name, index) in gameStore.names" :key="index" class="name-tag">
                                {{ name }}
                                <button @click="removeName(index)" class="remove-btn">&times;</button>
                            </div>
                        </div>
                    </div>

                    <button
                        v-if="gameStore.isAdmin && gameStore.players.length > 1 && gameStore.names.length >= 2"
                        @click="startGame"
                        class="btn btn-secondary"
                    >
                        Start Game
                    </button>
                </div>
            </div>

            <button @click="goBack" class="btn btn-outline">Back to Start</button>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useGameStore } from "../stores/gameStore";


const router = useRouter();
const gameStore = useGameStore();
const newName = ref("");
const copied = ref(false);

const copyCode = () => {
    navigator.clipboard.writeText(gameStore.roomCode);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
};

// Auto-navigate to game when it starts
watch(
    () => gameStore.gameState,
    (newState) => {
        if (newState === "in_progress") {
            router.push("/game");
        }
    },
);

const addName = () => {
    if (newName.value.trim()) {
        gameStore.addName(newName.value.trim());
        newName.value = "";
    }
};

const removeName = (index) => {
    gameStore.removeName(index);
};

const startGame = () => {
    gameStore.startGame();
    router.push("/game");
};

const goBack = () => {
    if (gameStore.isAdmin) {
        if (confirm("Leaving will close the room and kick all players. Are you sure?")) {
            gameStore.destroyRoom();
            gameStore.resetGame();
            router.push("/");
        }
    } else {
        gameStore.leaveRoom();
        router.push("/");
    }
};
</script>

<style scoped>
.lobby-container {
    display: flex;
    justify-content: center;
    min-height: 60vh;
}

.lobby-card {
    background: white;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    width: 100%;
}

.room-info {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 40px;
    border-bottom: 2px solid #f0f0f0;
}

.room-info h2 {
    color: #666;
    font-size: 0.9rem;
    text-transform: uppercase;
    margin: 0;
    margin-bottom: 10px;
    letter-spacing: 1px;
}

.code-display {
    font-size: 3rem;
    font-weight: bold;
    color: #667eea;
    font-family: "Courier New", monospace;
    letter-spacing: 8px;
    cursor: pointer;
    user-select: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: opacity 0.2s;
}

.code-display:hover {
    opacity: 0.75;
}

.copy-hint {
    font-size: 0.75rem;
    font-family: Arial, sans-serif;
    letter-spacing: 1px;
    color: #999;
    font-weight: 400;
}

.players-section {
    margin-bottom: 40px;
}

.players-section h3 {
    color: #333;
    font-size: 1.2rem;
    margin: 0 0 15px 0;
}

.players-list {
    display: grid;
    gap: 10px;
}

.player-item {
    padding: 12px 16px;
    background: #f5f5f5;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #333;
}

.player-item.admin {
    background: #e8e4f3;
    border-left: 4px solid #667eea;
    padding-left: 12px;
}

.badge {
    font-weight: 600;
    font-size: 0.85rem;
}

.admin-section {
    background: #f9f7ff;
    padding: 30px;
    border-radius: 8px;
    margin-bottom: 30px;
    border: 2px solid #e8e4f3;
}

.admin-section h3 {
    color: #333;
    margin: 0 0 20px 0;
    font-size: 1.2rem;
}

.admin-controls {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    color: #333;
    font-weight: 600;
    margin-bottom: 8px;
}

.input-group {
    display: flex;
    gap: 10px;
}

.input-group input {
    flex: 1;
    padding: 10px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
}

.input-group input:focus {
    outline: none;
    border-color: #667eea;
}

.input-group .btn {
    padding: 10px 20px;
}

.names-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.names-list h4 {
    color: #333;
    margin: 0;
    font-size: 1rem;
}

.names-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.name-tag {
    background: white;
    padding: 8px 12px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 2px solid #667eea;
    color: #333;
    font-size: 0.9rem;
}

.remove-btn {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.remove-btn:hover {
    color: #e74c3c;
}

.btn {
    padding: 12px 24px;
    font-size: 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
}

.btn-primary {
    background: #667eea;
    color: white;
}

.btn-primary:hover {
    background: #5568d3;
    transform: translateY(-2px);
}

.btn-secondary {
    background: #764ba2;
    color: white;
    width: 100%;
}

.btn-secondary:hover {
    background: #653a8a;
    transform: translateY(-2px);
}

.btn-outline {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;
    width: 100%;
    margin-top: 10px;
}

.btn-outline:hover {
    background: #f9f7ff;
}
</style>
