<template>
    <div class="start-container">
        <div class="start-card">
            <h2>Welcome to Guess Who!</h2>
            <p class="subtitle">Select an option below to get started</p>

            <div class="button-group">
                <button class="btn btn-primary" @click="showJoinForm = true">
                    <span class="icon">👥</span>
                    Join Game
                </button>
                <button class="btn btn-secondary" @click="showHostForm = true">
                    <span class="icon">🎮</span>
                    Host Game
                </button>
            </div>
        </div>

        <!-- Join Game Modal -->
        <div v-if="showJoinForm" class="modal-overlay" @click="showJoinForm = false">
            <div class="modal" @click.stop>
                <button class="close-btn" @click="showJoinForm = false">&times;</button>
                <h3>Join Game</h3>
                <form @submit.prevent="handleJoin">
                    <div class="form-group">
                        <label for="join-name">Your Name</label>
                        <input
                            id="join-name"
                            v-model="joinForm.name"
                            type="text"
                            placeholder="Enter your name"
                            required
                        />
                    </div>
                    <div class="form-group">
                        <label for="join-code">Room Code</label>
                        <input
                            id="join-code"
                            v-model="joinForm.code"
                            type="text"
                            placeholder="Enter 6-character code"
                            maxlength="6"
                            required
                        />
                    </div>
                    <div v-if="gameStore.joinError" class="error-msg">
                        {{ gameStore.joinError }}
                    </div>
                    <button type="submit" class="btn btn-primary">Join</button>
                </form>
            </div>
        </div>

        <!-- Host Game Modal -->
        <div v-if="showHostForm" class="modal-overlay" @click="showHostForm = false">
            <div class="modal" @click.stop>
                <button class="close-btn" @click="showHostForm = false">&times;</button>
                <h3>Host Game</h3>
                <form @submit.prevent="handleHost">
                    <div class="form-group">
                        <label for="host-name">Your Name</label>
                        <input
                            id="host-name"
                            v-model="hostForm.name"
                            type="text"
                            placeholder="Enter your name"
                            required
                        />
                    </div>
                    <button type="submit" class="btn btn-primary">Create Game</button>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useGameStore } from "../stores/gameStore";

const router = useRouter();
const gameStore = useGameStore();

const showJoinForm = ref(false);
const showHostForm = ref(false);

const joinForm = ref({
    name: "",
    code: "",
});

const hostForm = ref({
    name: "",
});

const handleJoin = () => {
    gameStore.joinRoom(joinForm.value.code.toUpperCase(), joinForm.value.name);
    // Navigation happens in the store when ROOM_JOINED is confirmed
};

const handleHost = () => {
    gameStore.hostRoom(hostForm.value.name);
    showHostForm.value = false;
    // Navigation happens in the store when ROOM_CREATED is confirmed
};
</script>

<style scoped>
.error-msg {
    background: #fdecea;
    color: #c0392b;
    border: 1px solid #e74c3c;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 0.9rem;
    margin-bottom: 12px;
}

.start-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
}

.start-card {
    background: white;
    border-radius: 12px;
    padding: 60px 40px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 500px;
}

.start-card h2 {
    color: #333;
    font-size: 2rem;
    margin-bottom: 10px;
}

.subtitle {
    color: #666;
    font-size: 1.1rem;
    margin-bottom: 40px;
}

.button-group {
    display: flex;
    gap: 20px;
    justify-content: center;
}

.btn {
    padding: 15px 30px;
    font-size: 1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 150px;
}

.btn-primary {
    background: #667eea;
    color: white;
}

.btn-primary:hover {
    background: #5568d3;
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
    background: #764ba2;
    color: white;
}

.btn-secondary:hover {
    background: #653a8a;
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(118, 75, 162, 0.4);
}

.icon {
    font-size: 1.5rem;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal {
    background: white;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    position: relative;
    max-width: 400px;
    width: 90%;
}

.close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    color: #333;
}

.modal h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #333;
    font-size: 1.5rem;
}

.form-group {
    margin-bottom: 20px;
    text-align: left;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #333;
    font-weight: 600;
}

.form-group input {
    width: 100%;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.3s;
}

.form-group input:focus {
    outline: none;
    border-color: #667eea;
}

.modal .btn {
    width: 100%;
    justify-content: center;
    margin-top: 20px;
}
</style>
