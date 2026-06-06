const BASE = import.meta.env.BASE_URL; // "/" locally, "/AimeeGuessWho/" on GitHub Pages

export function localUrlForName(name) {
    return `${BASE}images/${name}.jpeg`;
}

export function defaultImageUrl() {
    return `${BASE}images/default.jpeg`;
}
