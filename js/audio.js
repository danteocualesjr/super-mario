// Audio manager for sound effects

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.enabled = true;
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    // Generate a beep sound
    beep(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Play jump sound
    playJump() {
        this.beep(400, 0.1, 'sine', 0.2);
    }

    // Play coin collection sound
    playCoin() {
        this.beep(800, 0.15, 'sine', 0.3);
        setTimeout(() => this.beep(1000, 0.15, 'sine', 0.3), 50);
    }

    // Play power-up sound
    playPowerUp() {
        this.beep(300, 0.1, 'sine', 0.3);
        setTimeout(() => this.beep(400, 0.1, 'sine', 0.3), 100);
        setTimeout(() => this.beep(500, 0.1, 'sine', 0.3), 200);
    }

    // Play enemy defeat sound
    playEnemyDefeat() {
        this.beep(200, 0.2, 'square', 0.3);
    }

    // Play death sound
    playDeath() {
        this.beep(150, 0.3, 'sawtooth', 0.4);
        setTimeout(() => this.beep(100, 0.3, 'sawtooth', 0.4), 200);
    }

    // Play fireball sound
    playFireball() {
        this.beep(600, 0.1, 'square', 0.2);
    }

    // Toggle sound on/off
    toggle() {
        this.enabled = !this.enabled;
    }
}

