# Guess Who Game

A web-based Guess Who game using WebSockets and Vue.js.

## Project Structure

```
AimeeGuessWho/
├── backend/              # Node.js WebSocket server
│   ├── src/
│   │   ├── server.js     # Main server file
│   │   ├── handlers/     # Message handlers
│   │   ├── models/       # Game models (Room, etc.)
│   │   └── utils/        # Utilities (roomManager, etc.)
│   ├── package.json
│   └── .env.example
└── frontend/             # Vue.js frontend
    ├── src/
    │   ├── components/   # Vue components
    │   ├── views/        # Page views
    │   ├── stores/       # Pinia stores
    │   ├── App.vue       # Root component
    │   └── main.js       # Entry point
    ├── public/           # Static files
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Setup

### Backend

1. Navigate to the backend directory:

    ```bash
    cd backend
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file from `.env.example`:

    ```bash
    cp .env.example .env
    ```

4. Start the development server:
    ```bash
    npm run dev
    ```

### Frontend

1. Navigate to the frontend directory:

    ```bash
    cd frontend
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:
    ```bash
    npm run dev
    ```

## Game Flow

1. **Join**: Players join using a room code
2. **Admin Setup**: Admin enters names into the pot
3. **Game Start**: One player is selected and assigned a name (kept secret from them)
4. **Gameplay**: Other players see the name list and mark names as ruled out (irreversible)
5. **Final Guess**: Eventually implement buzzer feature for final guesses

## Features To Implement

- [ ] Room creation and joining
- [ ] Real-time player synchronization
- [ ] Admin panel for name entry
- [ ] Name selection and assignment
- [ ] Mark names as ruled out
- [ ] Game state management
- [ ] Buzzer/final guess feature
- [ ] UI components
