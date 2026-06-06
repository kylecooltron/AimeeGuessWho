<template>
    <div class="rules">
        <h3>Gameplay</h3>
        <ul>
            <li>Anyone may guess at any time.</li>
            <li>The target player confirms whether guess is correct.</li>
            <li>Crossed-out names are for personal notes only.</li>
        </ul>
        <h3>Questions</h3>
        <ul>
            <li>Ask yes-or-no questions only.</li>
            <li>No questions about physical appearance.</li>
            <li>No direct questions about a character's campaign or world.</li>
        </ul>
    </div>
</template>

<style scoped>
.rules {
    background: #f9f7ff;
    border-radius: 8px;
    padding: 20px 24px;
    border: 1px solid #e8e4f3;
    text-align: left;
    margin-bottom: 2em;
    margin-top: 2em;
}

.rules h3 {
    color: #667eea;
    font-size: 1rem;
    margin: 16px 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.rules h3:first-child {
    margin-top: 0;
}

.rules ul {
    margin: 0;
    padding-left: 20px;
    color: #444;
    font-size: 0.9rem;
    line-height: 1.7;
}
</style>
