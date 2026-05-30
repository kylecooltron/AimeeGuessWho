<template>
    <div class="game-container">
        <!-- Message Feed -->
        <div class="message-feed">
            <div class="messages-header">
                <h3>Game Feed</h3>
            </div>
            <div class="messages-list">
                <div v-for="(msg, index) in gameStore.messages" :key="index" class="message">
                    <span class="timestamp">{{ msg.timestamp }}</span>
                    <span class="text">{{ msg.text }}</span>
                </div>
            </div>
        </div>

        <!-- Game Board -->
        <div class="game-board">
            <div v-if="gameStore.isAssigned" class="assigned-section">
                <h2>Your Name Is:</h2>
                <div class="assigned-name-display">
                    {{ gameStore.assignedName }}
                </div>
                <p class="assigned-hint">Other players are trying to figure out who you are. Don't give it away!</p>
            </div>

            <div v-else class="names-section">
                <h2>Eliminate Names</h2>
                <div class="names-grid">
                    <div
                        v-for="(name, index) in gameStore.names"
                        :key="index"
                        class="name-card"
                        :class="{ eliminated: isNameRuledOut(index) }"
                        @click="eliminateName(index)"
                    >
                        <div class="name-text">{{ name }}</div>
                        <div v-if="isNameRuledOut(index)" class="eliminated-overlay">✓</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Players List Sidebar -->
        <div class="sidebar">
            <h3>Players</h3>
            <div class="players-list">
                <div
                    v-for="player in gameStore.players"
                    :key="player.id"
                    class="player-item"
                    :class="{ current: player.id === gameStore.playerId }"
                >
                    <span class="name">{{ player.name }}</span>
                    <span v-if="player.id === gameStore.selectedPlayerName" class="badge">🎯</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { useGameStore } from "../stores/gameStore";

const gameStore = useGameStore();

const isNameRuledOut = (nameIndex) => {
    return gameStore.ruledOut.has(gameStore.playerId) && gameStore.ruledOut.get(gameStore.playerId).has(nameIndex);
};

const eliminateName = (nameIndex) => {
    if (!isNameRuledOut(nameIndex)) {
        gameStore.markNameAsRuledOut(nameIndex);
    }
};
</script>

<style scoped>
.game-container {
    display: grid;
    grid-template-columns: 1fr 3fr 250px;
    gap: 20px;
    padding: 20px;
    height: calc(100vh - 100px);
    background: #f5f5f5;
}

/* Message Feed */
.message-feed {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    max-height: 100%;
    overflow: hidden;
    grid-column: 1;
    grid-row: 1 / 3;
}

.messages-header h3 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 1.1rem;
}

.messages-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.message {
    padding: 10px;
    background: #f9f9f9;
    border-left: 3px solid #667eea;
    border-radius: 4px;
    font-size: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.timestamp {
    font-size: 0.8rem;
    color: #999;
}

.text {
    color: #333;
    line-height: 1.4;
}

/* Game Board */
.game-board {
    background: white;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-column: 2;
    grid-row: 1;
}

.game-board h2 {
    color: #333;
    margin-bottom: 30px;
    font-size: 1.8rem;
}

/* Assigned Section */
.assigned-section {
    text-align: center;
    width: 100%;
}

.assigned-name-display {
    font-size: 4rem;
    font-weight: bold;
    color: #667eea;
    padding: 40px;
    background: linear-gradient(135deg, #667eea20, #764ba220);
    border-radius: 12px;
    margin: 20px 0;
    font-family: "Arial", sans-serif;
    letter-spacing: 2px;
}

.assigned-hint {
    color: #666;
    font-size: 1.1rem;
    margin-top: 20px;
}

/* Names Section */
.names-section {
    width: 100%;
}

.names-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 15px;
    margin-top: 20px;
}

.name-card {
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80px;
    position: relative;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.name-card:hover:not(.eliminated) {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.name-card.eliminated {
    background: #ddd;
    color: #999;
    cursor: not-allowed;
    opacity: 0.6;
}

.name-card.eliminated .name-text {
    text-decoration: line-through;
}

.name-text {
    transition: all 0.3s ease;
    word-wrap: break-word;
    font-size: 0.95rem;
}

.eliminated-overlay {
    position: absolute;
    font-size: 2rem;
    color: #666;
}

/* Sidebar */
.sidebar {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    grid-column: 3;
    grid-row: 1 / 3;
    display: flex;
    flex-direction: column;
}

.sidebar h3 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 1.1rem;
}

.players-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.player-item {
    padding: 12px;
    background: #f5f5f5;
    border-radius: 6px;
    border-left: 3px solid transparent;
    transition: all 0.2s ease;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.player-item.current {
    background: #e8e4f3;
    border-left-color: #667eea;
    font-weight: 600;
}

.player-item .name {
    color: #333;
    flex: 1;
}

.badge {
    font-size: 1.2rem;
    margin-left: 8px;
}

@media (max-width: 1200px) {
    .game-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto;
    }

    .message-feed {
        grid-column: 1;
        grid-row: 1;
    }

    .game-board {
        grid-column: 1;
        grid-row: 2;
    }

    .sidebar {
        grid-column: 1;
        grid-row: 3;
    }
}
</style>
