// UI and HUD management

class UIManager {
    constructor() {
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.coinsElement = document.getElementById('coins');
        this.levelElement = document.getElementById('level');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.finalScoreElement = document.getElementById('final-score');
    }

    updateScore(score) {
        this.scoreElement.textContent = score;
    }

    updateLives(lives) {
        this.livesElement.textContent = lives;
    }

    updateCoins(coins) {
        this.coinsElement.textContent = coins;
    }

    updateLevel(level) {
        this.levelElement.textContent = level;
    }

    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
    }

    hideStartScreen() {
        this.startScreen.classList.add('hidden');
    }

    showGameOverScreen(finalScore) {
        this.finalScoreElement.textContent = finalScore;
        this.gameOverScreen.classList.remove('hidden');
    }

    hideGameOverScreen() {
        this.gameOverScreen.classList.add('hidden');
    }

    showPauseScreen() {
        this.pauseScreen.classList.remove('hidden');
    }

    hidePauseScreen() {
        this.pauseScreen.classList.add('hidden');
    }

    isPauseScreenVisible() {
        return !this.pauseScreen.classList.contains('hidden');
    }
}

