// Main game engine

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.setCanvasSize();
        
        // Focus canvas to receive keyboard events
        this.canvas.focus();
        
        this.physics = new Physics();
        this.audio = new AudioManager();
        this.ui = new UIManager();
        
        this.keys = {};
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.lives = 3;
        this.coins = 0;
        this.currentLevel = 1;
        this.highScore = parseInt(localStorage.getItem('marioHighScore') || '0');
        
        this.player = null;
        this.level = null;
        this.camera = { x: 0, y: 0, width: 0, height: 0 };
        
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedDeltaTime = 1 / 60;
        
        this.init();
    }

    setCanvasSize() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.camera.width = this.canvas.width;
        this.camera.height = this.canvas.height;
    }

    init() {
        // Keyboard event listeners
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Prevent default for game controls
            if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
            }
            
            if (this.gameState === 'menu') {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    this.startGame();
                }
            } else if (this.gameState === 'gameOver') {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    this.restartGame();
                }
            } else if (this.gameState === 'playing') {
                if (e.key === 'p' || e.key === 'P') {
                    e.preventDefault();
                    this.togglePause();
                }
            } else if (this.gameState === 'paused') {
                if (e.key === 'p' || e.key === 'P') {
                    e.preventDefault();
                    this.togglePause();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.setCanvasSize();
        });

        // Start game loop
        this.gameLoop(0);
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.coins = 0;
        this.currentLevel = 1;
        this.ui.hideStartScreen();
        this.loadLevel(this.currentLevel);
    }

    restartGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.coins = 0;
        this.currentLevel = 1;
        this.ui.hideGameOverScreen();
        this.loadLevel(this.currentLevel);
    }

    loadLevel(levelNum) {
        const levelData = generateLevel(levelNum);
        this.level = new Level(levelData);
        this.player = new Player(levelData.startX, levelData.startY);
        this.camera.x = 0;
        this.camera.y = 0;
        this.ui.updateLevel(levelNum);
    }

    nextLevel() {
        this.currentLevel++;
        this.loadLevel(this.currentLevel);
        this.audio.playPowerUp();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.ui.showPauseScreen();
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.ui.hidePauseScreen();
        }
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;

        // Update player
        this.player.update(this.keys, this.physics, this.level, deltaTime, this.audio);

        // Update level (enemies, collectibles, power-ups)
        this.level.update(this.physics, this.player);

        // Update camera to follow player
        this.camera.x = Math.max(0, this.player.x - this.canvas.width / 2);
        this.camera.x = Math.min(this.camera.x, this.level.width * this.level.tileSize - this.canvas.width);

        // Check collectible collisions
        const collected = this.level.checkCollectibleCollision(this.player.getBounds());
        if (collected) {
            this.coins++;
            this.score += 100;
            this.ui.updateCoins(this.coins);
            this.ui.updateScore(this.score);
            this.audio.playCoin();
        }

        // Check power-up collisions
        const powerUp = this.level.checkPowerUpCollision(this.player.getBounds());
        if (powerUp) {
            if (this.player.powerUp(powerUp.type)) {
                this.score += 500;
                this.ui.updateScore(this.score);
                this.audio.playPowerUp();
            }
        }

        // Check enemy collisions
        this.level.enemies.forEach(enemy => {
            if (!enemy.active || enemy.dead) return;

            const enemyBounds = enemy.getBounds();
            const playerBounds = this.player.getBounds();

            if (this.physics.checkCollision(playerBounds, enemyBounds)) {
                const side = this.physics.getCollisionSide(playerBounds, enemyBounds);
                
                if (side === 'top' && this.player.velocityY > 0) {
                    // Player jumped on enemy
                    const points = enemy.hitFromAbove();
                    if (points > 0) {
                        this.score += points;
                        this.ui.updateScore(this.score);
                        this.audio.playEnemyDefeat();
                        this.player.velocityY = -8; // Bounce
                    }
                } else if (!this.player.invulnerable) {
                    // Player hit enemy from side
                    const result = enemy.hitFromSide();
                    if (result === -1) {
                        // Player takes damage
                        const isDead = this.player.takeDamage();
                        if (isDead) {
                            this.playerDie();
                        }
                    } else if (result > 0) {
                        this.score += result;
                        this.ui.updateScore(this.score);
                        this.audio.playEnemyDefeat();
                    }
                }
            }
        });

        // Check fireball collisions with enemies
        this.player.fireballs.forEach(fireball => {
            if (!fireball.active) return;

            this.level.enemies.forEach(enemy => {
                if (!enemy.active || enemy.dead) return;

                if (this.physics.checkCollision(fireball.getBounds(), enemy.getBounds())) {
                    const points = enemy.hitFromAbove();
                    if (points > 0) {
                        this.score += points;
                        this.ui.updateScore(this.score);
                        this.audio.playEnemyDefeat();
                    }
                    fireball.active = false;
                }
            });
        });

        // Check fireball collisions with tiles
        this.player.fireballs.forEach(fireball => {
            const tileX = Math.floor(fireball.x / this.level.tileSize);
            const tileY = Math.floor(fireball.y / this.level.tileSize);
            
            if (tileX >= 0 && tileX < this.level.width && tileY >= 0 && tileY < this.level.height) {
                const tile = this.level.getTile(tileX, tileY);
                if (tile && tile !== 0 && tile !== 'c' && tile !== 'm' && tile !== 'f') {
                    fireball.active = false;
                }
            }

            // Bounce fireball on ground
            if (fireball.velocityY > 0 && fireball.bounceCount < 3) {
                const groundTileY = Math.floor((fireball.y + fireball.height) / this.level.tileSize);
                const groundTileX = Math.floor(fireball.x / this.level.tileSize);
                
                if (groundTileY < this.level.height) {
                    const tile = this.level.getTile(groundTileX, groundTileY);
                    if (tile && tile !== 0 && tile !== 'c' && tile !== 'm' && tile !== 'f') {
                        fireball.velocityY = -5;
                        fireball.bounceCount++;
                    }
                }
            }
        });

        // Check if player fell off the map
        if (this.player.y > this.level.height * this.level.tileSize) {
            this.playerDie();
        }

        // Check if player reached end of level
        if (this.player.x >= this.level.endX) {
            this.nextLevel();
        }

        // Play jump sound
        if ((this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'] || this.keys[' ']) && this.player.onGround) {
            // Sound is played in player update, but we can add it here too
        }
    }

    playerDie() {
        this.lives--;
        this.ui.updateLives(this.lives);
        this.audio.playDeath();

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn player
            this.player.reset();
            this.camera.x = 0;
        }
    }

    gameOver() {
        this.gameState = 'gameOver';
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('marioHighScore', this.highScore.toString());
        }
        
        this.ui.showGameOverScreen(this.score);
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState === 'playing' || this.gameState === 'paused') {
            // Draw level
            this.level.draw(this.ctx, this.camera);

            // Draw player
            this.player.draw(this.ctx, this.camera);
        }
    }

    gameLoop(currentTime) {
        const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 2); // Cap at 2x speed
        this.lastTime = currentTime;

        this.accumulator += deltaTime;

        while (this.accumulator >= this.fixedDeltaTime) {
            this.update(this.fixedDeltaTime);
            this.accumulator -= this.fixedDeltaTime;
        }

        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new Game();
});

