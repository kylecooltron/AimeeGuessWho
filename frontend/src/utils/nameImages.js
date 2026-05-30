const EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function toKey(name) {
    return name.trim().toLowerCase().replace(/\s+/g, "-");
}

const BASE = import.meta.env.BASE_URL; // "/" locally, "/AimeeGuessWho/" on GitHub Pages

export function localUrlsForName(name) {
    const key = toKey(name);
    return EXTENSIONS.map((ext) => `${BASE}images/${key}.${ext}`);
}

export function catFallback(name) {
    // Derive a consistent size from the name so each name gets a different cat photo
    const seed = toKey(name).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const w = 200 + (seed % 50);
    const h = 200 + ((seed * 3) % 50);
    return `https://placecats.com/${w}/${h}`;
}
