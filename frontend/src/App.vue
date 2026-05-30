<template>
    <div id="app" class="app">
        <header class="header">
            <h1 class="home-link" @click="goHome">Guess Who</h1>
        </header>
        <main>
            <RouterView />
        </main>
    </div>
</template>

<script setup>
import { RouterView, useRouter } from "vue-router";
import { useGameStore } from "./stores/gameStore";

const gameStore = useGameStore();
const router = useRouter();
gameStore.connectWebSocket();

function goHome() {
    gameStore.leaveRoom();
    router.push("/");
}
</script>

<style scoped>
.app {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
    padding: 20px;
    background: rgba(0, 0, 0, 0.2);
    color: white;
    text-align: center;
}

.header h1 {
    margin: 0;
    font-size: 2.5rem;
}

.home-link {
    cursor: pointer;
    transition: opacity 0.2s;
}

.home-link:hover {
    opacity: 0.75;
}

main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
}
</style>
