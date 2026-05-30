const EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function toKey(name) {
    return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export function localUrlsForName(name) {
    const key = toKey(name);
    return EXTENSIONS.map((ext) => `/images/${key}.${ext}`);
}

export function catFallback(name) {
    // Use a numeric seed derived from the name so each name gets a consistent cat photo
    const seed = toKey(name).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return `https://cataas.com/cat?position=center&seed=${seed}`;
}
