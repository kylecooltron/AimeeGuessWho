import { createRouter, createWebHashHistory } from "vue-router";
import StartView from "./views/StartView.vue";
import LobbyView from "./views/LobbyView.vue";
import GameView from "./views/GameView.vue";

const routes = [
    {
        path: "/",
        name: "Start",
        component: StartView,
    },
    {
        path: "/lobby",
        name: "Lobby",
        component: LobbyView,
    },
    {
        path: "/game",
        name: "Game",
        component: GameView,
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
