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
    const roundOver = ref(false);
    const eliminateOnWrongGuess = ref(false);
    const eliminatedPlayers = ref(new Set());
    const joinError = ref(null);
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
                roomCode.value = payload.roomCode;
                players.value = payload.players || [];
                router.push("/lobby");
                break;

            case "ROOM_JOINED":
                joinError.value = null;
                roomCode.value = payload.roomCode;
                players.value = payload.players || [];
                router.push("/lobby");
                break;

            case "PLAYERS_UPDATED":
                players.value = payload.players || [];
                break;

            case "PLAYER_LEFT":
                players.value = payload.players || [];
                break;

            case "ROOM_DESTROYED":
                resetGame();
                router.push("/");
                break;

            case "NAMES_UPDATED":
                console.log("Names updated:", payload.names);
                names.value = payload.names || [];
                break;

            case "GAME_STARTED":
                gameState.value = "in_progress";
                selectedName.value = payload.selectedName;
                selectedPlayerName.value = payload.selectedPlayerId;
                isAssigned.value = payload.isAssigned;
                assignedName.value = payload.assignedName;
                names.value = payload.names || [];
                players.value = payload.players || [];
                eliminateOnWrongGuess.value = payload.eliminateOnWrongGuess || false;
                eliminatedPlayers.value = new Set();
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
                if (payload.eliminatedPlayerId) {
                    eliminatedPlayers.value = new Set([...eliminatedPlayers.value, payload.eliminatedPlayerId]);
                    addToast(`${payload.eliminatedPlayerName} guessed wrong and is out!`);
                }
                guessingPlayer.value = null;
                break;

            case "WINNER_DECLARED":
                guessingPlayer.value = null;
                roundOver.value = true;
                addToast(`🎉 ${payload.winnerName} won!`);
                break;

            case "GAME_RESTARTED":
                ruledOut.value = new Map();
                toastMessages.value = [];
                guessingPlayer.value = null;
                roundOver.value = false;
                eliminatedPlayers.value = new Set();
                eliminateOnWrongGuess.value = payload.eliminateOnWrongGuess || false;
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
                joinError.value = payload.message;
                break;

            default:
                console.log("Unknown message type:", type);
        }
    }

    function sendMessage(type, payload) {
        if (!ws.value) return;

        // Snapshot roomCode now so a reconnect can't change what gets sent
        const capturedRoomCode = roomCode.value;
        const send = () => {
            ws.value.send(
                JSON.stringify({
                    type,
                    roomCode: capturedRoomCode,
                    payload,
                }),
            );
        };

        if (ws.value.readyState === WebSocket.OPEN) {
            send();
        } else if (ws.value.readyState === WebSocket.CONNECTING) {
            ws.value.addEventListener("open", send, { once: true });
        }
    }

    function joinRoom(code, name) {
        joinError.value = null;
        playerName.value = name;
        playerId.value = Math.random().toString(36).substring(7);
        isAdmin.value = false;

        // Don't set roomCode yet — send code in payload, set from server response
        sendMessage("JOIN_ROOM", {
            targetRoomCode: code,
            playerId: playerId.value,
            playerName: name,
        });
    }

    function hostRoom(name) {
        playerName.value = name;
        playerId.value = Math.random().toString(36).substring(7);
        isAdmin.value = true;
        gameState.value = "names_entry";

        // Don't set roomCode here — wait for server's ROOM_CREATED response
        sendMessage("CREATE_ROOM", {
            adminId: playerId.value,
            adminName: name,
        });
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
        sendMessage("START_GAME", { names: names.value, eliminateOnWrongGuess: eliminateOnWrongGuess.value });
    }

    function destroyRoom() {
        sendMessage("DESTROY_ROOM", {});
    }

    function restartGame() {
        sendMessage("RESTART_GAME", {});
    }

    function endGame() {
        sendMessage("END_GAME", {});
    }

    function declareWinner(winnerName) {
        sendMessage("DECLARE_WINNER", { winnerName });
    }

    function makeGuess() {
        sendMessage("MAKE_GUESS", {});
    }

    function closeGuessModal(eliminate = false) {
        sendMessage("DISMISS_GUESS", {
            eliminate,
            playerId: guessingPlayer.value?.id,
            playerName: guessingPlayer.value?.name,
        });
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

    function leaveRoom() {
        const old = ws.value;
        ws.value = null;
        resetGame();
        if (old) old.close();
        // Reconnect so the user can host/join again without refreshing
        connectWebSocket();
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
        roundOver.value = false;
        eliminateOnWrongGuess.value = false;
        eliminatedPlayers.value = new Set();
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
        roundOver,
        eliminateOnWrongGuess,
        eliminatedPlayers,
        joinError,

        // Methods
        connectWebSocket,
        sendMessage,
        joinRoom,
        hostRoom,
        addName,
        removeName,
        startGame,
        markNameAsRuledOut,
        leaveRoom,
        destroyRoom,
        restartGame,
        endGame,
        declareWinner,
        makeGuess,
        closeGuessModal,
        resetGame,
        addMessage,
        addToast,
    };
});
