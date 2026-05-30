import { defineStore } from "pinia";
import { ref } from "vue";
import router from "../router";

export const useGameStore = defineStore("game", () => {
    const roomCode = ref(null);
    const playerId = ref(null);
    const playerName = ref("");
    const isAdmin = ref(false);
    const players = ref([]);
    const names = ref([]);
    const gameState = ref("lobby"); // 'lobby', 'names_entry', 'in_progress', 'finished'
    const selectedName = ref(null);
    const selectedPlayerName = ref(null);
    const assignedName = ref(null);
    const isAssigned = ref(false);
    const ruledOut = ref(new Map());
    const messages = ref([]);
    const toastMessages = ref([]);
    const guessingPlayer = ref(null);
    const ws = ref(null);
    let toastIdCounter = 0;

    // Connect to WebSocket
    function connectWebSocket() {
        ws.value = new WebSocket(import.meta.env.VITE_WS_URL || "ws://localhost:3001");

        ws.value.onopen = () => {
            console.log("Connected to WebSocket");
        };

        ws.value.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleMessage(data);
            } catch (error) {
                console.error("Failed to parse message:", error);
            }
        };

        ws.value.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.value.onclose = () => {
            console.log("Disconnected from WebSocket");
        };
    }

    function handleMessage(data) {
        const { type, payload } = data;

        switch (type) {
            case "ROOM_CREATED":
                console.log("Room created successfully");
                players.value = payload.players || [];
                break;

            case "ROOM_JOINED":
                console.log("Joined room successfully");
                players.value = payload.players || [];
                break;

            case "PLAYERS_UPDATED":
                console.log("Players updated:", payload.players);
                players.value = payload.players || [];
                break;

            case "NAMES_UPDATED":
                console.log("Names updated:", payload.names);
                names.value = payload.names || [];
                break;

            case "GAME_STARTED":
                console.log("Game started");
                gameState.value = "in_progress";
                selectedName.value = payload.selectedName;
                selectedPlayerName.value = payload.selectedPlayerId;
                isAssigned.value = payload.isAssigned;
                assignedName.value = payload.assignedName;
                names.value = payload.names || [];
                players.value = payload.players || [];
                addMessage(`Game started! 🎮`);
                break;

            case "NAME_RULED_OUT":
                if (!ruledOut.value.has(payload.playerId)) {
                    ruledOut.value.set(payload.playerId, new Set());
                }
                ruledOut.value.get(payload.playerId).add(payload.nameIndex);
                const ruledOutPlayer = players.value.find(p => p.id === payload.playerId);
                addToast(`${ruledOutPlayer ? ruledOutPlayer.name : "Someone"} eliminated a name.`);
                break;

            case "PLAYER_GUESSING":
                guessingPlayer.value = { id: payload.playerId, name: payload.playerName };
                break;

            case "GUESS_DISMISSED":
                guessingPlayer.value = null;
                break;

            case "GAME_RESTARTED":
                ruledOut.value = new Map();
                toastMessages.value = [];
                guessingPlayer.value = null;
                selectedPlayerName.value = payload.selectedPlayerId;
                isAssigned.value = payload.isAssigned;
                assignedName.value = payload.assignedName;
                names.value = payload.names || [];
                players.value = payload.players || [];
                addToast("New round started!");
                break;

            case "GAME_ENDED":
                resetGame();
                router.push("/");
                break;

            case "ERROR":
                console.error("Server error:", payload.message);
                break;

            default:
                console.log("Unknown message type:", type);
        }
    }

    function sendMessage(type, payload) {
        const send = () => {
            ws.value.send(
                JSON.stringify({
                    type,
                    roomCode: roomCode.value,
                    payload,
                }),
            );
        };

        if (!ws.value) return;

        if (ws.value.readyState === WebSocket.OPEN) {
            send();
        } else if (ws.value.readyState === WebSocket.CONNECTING) {
            ws.value.addEventListener("open", send, { once: true });
        }
    }

    function joinRoom(code, name) {
        roomCode.value = code;
        playerName.value = name;
        playerId.value = Math.random().toString(36).substring(7);
        isAdmin.value = false;
        players.value = [{ id: playerId.value, name, isAdmin: false }];

        sendMessage("JOIN_ROOM", {
            playerId: playerId.value,
            playerName: name,
        });
    }

    function hostRoom(code, name) {
        roomCode.value = code;
        playerName.value = name;
        playerId.value = Math.random().toString(36).substring(7);
        isAdmin.value = true;
        players.value = [{ id: playerId.value, name, isAdmin: true }];
        gameState.value = "names_entry";

        sendMessage("CREATE_ROOM", {
            roomCode: code,
            adminId: playerId.value,
            adminName: name,
        });
    }

    function generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    function addName(name) {
        names.value.push(name);
        sendMessage("ADD_NAME", { name });
    }

    function removeName(index) {
        names.value.splice(index, 1);
        sendMessage("REMOVE_NAME", { index });
    }

    function startGame() {
        gameState.value = "in_progress";
        sendMessage("START_GAME", { names: names.value });
    }

    function restartGame() {
        sendMessage("RESTART_GAME", {});
    }

    function endGame() {
        sendMessage("END_GAME", {});
    }

    function makeGuess() {
        sendMessage("MAKE_GUESS", {});
    }

    function closeGuessModal() {
        sendMessage("DISMISS_GUESS", {});
    }

    function markNameAsRuledOut(nameIndex) {
        if (!ruledOut.value.has(playerId.value)) {
            ruledOut.value.set(playerId.value, new Set());
        }
        ruledOut.value.get(playerId.value).add(nameIndex);

        sendMessage("RULE_OUT_NAME", {
            nameIndex,
        });
    }

    function resetGame() {
        roomCode.value = null;
        playerId.value = null;
        playerName.value = "";
        isAdmin.value = false;
        players.value = [];
        names.value = [];
        gameState.value = "lobby";
        selectedName.value = null;
        selectedPlayerName.value = null;
        assignedName.value = null;
        isAssigned.value = false;
        ruledOut.value = new Map();
        messages.value = [];
        toastMessages.value = [];
        guessingPlayer.value = null;
    }

    function addMessage(message) {
        messages.value.push({
            text: message,
            timestamp: new Date().toLocaleTimeString(),
        });
    }

    function addToast(text) {
        const id = ++toastIdCounter;
        toastMessages.value.unshift({ id, text });
        if (toastMessages.value.length > 3) {
            toastMessages.value.pop();
        }
        setTimeout(() => {
            const idx = toastMessages.value.findIndex((t) => t.id === id);
            if (idx !== -1) toastMessages.value.splice(idx, 1);
        }, 5000);
    }

    return {
        // State
        roomCode,
        playerId,
        playerName,
        isAdmin,
        players,
        names,
        gameState,
        selectedName,
        selectedPlayerName,
        assignedName,
        isAssigned,
        ruledOut,
        messages,
        toastMessages,
        guessingPlayer,

        // Methods
        connectWebSocket,
        sendMessage,
        joinRoom,
        hostRoom,
        generateRoomCode,
        addName,
        removeName,
        startGame,
        markNameAsRuledOut,
        restartGame,
        endGame,
        makeGuess,
        closeGuessModal,
        resetGame,
        addMessage,
        addToast,
    };
});
