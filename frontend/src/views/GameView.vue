<template>
    <!-- Floating Toast Feed -->
    <div class="toast-feed">
        <TransitionGroup name="toast" tag="div" class="toast-list">
            <div v-for="toast in gameStore.toastMessages" :key="toast.id" class="toast-item">
                {{ toast.text }}
            </div>
        </TransitionGroup>
    </div>

    <!-- Guess Modal -->
    <Transition name="modal">
        <div v-if="gameStore.guessingPlayer" class="modal-overlay">
            <div class="guess-modal">
                <div class="guess-icon">🔔</div>
                <h2>{{ gameStore.guessingPlayer.name }} is making a guess!</h2>
                <button
                    v-if="gameStore.guessingPlayer.id === gameStore.playerId"
                    @click="gameStore.closeGuessModal()"
                    class="btn-dismiss"
                >
                    Dismiss
                </button>
            </div>
        </div>
    </Transition>

    <div class="game-container">
        <!-- Host controls -->
        <div v-if="gameStore.isAdmin" class="end-game-bar">
            <button class="restart-btn" @click="gameStore.restartGame()">Restart Round</button>
            <button class="end-game-btn" @click="gameStore.endGame()">End Game</button>
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
                        <div class="card-image-wrap">
                            <img :src="imgSrc(name)" :alt="name" class="card-img" @error="imgError(name)" />
                        </div>
                        <div class="name-text">{{ name }}</div>
                        <div v-if="isNameRuledOut(index)" class="eliminated-overlay">✕</div>
                    </div>
                </div>

                <button class="guess-btn" @click="gameStore.makeGuess()">GUESS</button>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref } from "vue";
import { useGameStore } from "../stores/gameStore";
import { localUrlsForName, catFallback } from "../utils/nameImages";

const gameStore = useGameStore();

// Tracks how many local URL attempts have failed per name
const imgAttempts = ref({});

function imgSrc(name) {
    const attempts = imgAttempts.value[name] || 0;
    const locals = localUrlsForName(name);
    if (attempts < locals.length) return locals[attempts];
    return catFallback(name);
}

function imgError(name) {
    const attempts = imgAttempts.value[name] || 0;
    imgAttempts.value[name] = attempts + 1;
}

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
/* Toast Feed */
.toast-feed {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 500;
    width: 340px;
    pointer-events: none;
}

.toast-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.toast-item {
    background: rgba(30, 30, 40, 0.92);
    color: white;
    padding: 12px 18px;
    border-radius: 8px;
    font-size: 0.9rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    border-left: 3px solid #667eea;
}

.toast-enter-active,
.toast-leave-active {
    transition: all 0.35s ease;
}
.toast-enter-from {
    opacity: 0;
    transform: translateY(-16px);
}
.toast-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
.toast-move {
    transition: transform 0.35s ease;
}

/* Guess Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.guess-modal {
    background: white;
    border-radius: 16px;
    padding: 50px 60px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    max-width: 420px;
    width: 90%;
}

.guess-icon {
    font-size: 3.5rem;
    margin-bottom: 16px;
}

.guess-modal h2 {
    color: #333;
    font-size: 1.5rem;
    margin: 0 0 30px 0;
    line-height: 1.4;
}

.btn-dismiss {
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 32px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-dismiss:hover {
    background: #c0392b;
}

.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

/* End Game Bar */
.end-game-bar {
    display: flex;
    justify-content: flex-end;
    padding: 10px 20px 0;
}

.restart-btn,
.end-game-btn {
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 6px;
    padding: 6px 16px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
}

.restart-btn:hover {
    background: rgba(102, 126, 234, 0.8);
    color: white;
    border-color: transparent;
}

.end-game-btn:hover {
    background: rgba(231, 76, 60, 0.8);
    color: white;
    border-color: transparent;
}

/* Game Layout */
.game-container {
    padding: 20px;
    height: calc(100vh - 100px);
}

/* Game Board */
.game-board {
    background: white;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
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
    margin: auto 0;
}

.assigned-name-display {
    font-size: 4rem;
    font-weight: bold;
    color: #667eea;
    padding: 40px;
    background: linear-gradient(135deg, #667eea20, #764ba220);
    border-radius: 12px;
    margin: 20px 0;
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
}

.names-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
    width: 100%;
}

.name-card {
    background: white;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    position: relative;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.name-card:hover:not(.eliminated) {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.card-image-wrap {
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    background: #eee;
}

.card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: filter 0.3s ease;
}

.name-card.eliminated .card-img {
    filter: grayscale(100%) opacity(0.4);
}

.name-text {
    padding: 8px 6px;
    font-weight: 700;
    font-size: 0.9rem;
    color: #333;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    word-wrap: break-word;
    transition: all 0.3s ease;
}

.name-card.eliminated .name-text {
    text-decoration: line-through;
    background: #bbb;
}

.eliminated-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -60%);
    font-size: 3rem;
    font-weight: 900;
    color: rgba(200, 0, 0, 0.75);
    pointer-events: none;
}

.guess-btn {
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 18px 60px;
    font-size: 1.4rem;
    font-weight: 800;
    cursor: pointer;
    letter-spacing: 2px;
    box-shadow: 0 6px 20px rgba(231, 76, 60, 0.45);
    transition: all 0.2s ease;
}

.guess-btn:hover {
    background: #c0392b;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(231, 76, 60, 0.6);
}

.guess-btn:active {
    transform: translateY(0);
}

</style>
