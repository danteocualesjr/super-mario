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
        // #region agent log
        console.log('[DEBUG] init() called, gameState:', this.gameState);
        fetch('http://127.0.0.1:7242/ingest/2e4625ef-98e5-48d8-a7ab-6d4230cfeb2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:init',message:'init() called',data:{gameState:this.gameState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch((err)=>console.error('[DEBUG] Fetch error:', err));
        // #endregion
        
        // Click handler to focus canvas
        this.canvas.addEventListener('click', () => {
            console.log('[DEBUG] Canvas clicked, focusing...');
            this.canvas.focus();
            console.log('[DEBUG] Canvas focused, document.activeElement:', document.activeElement);
        });
        
        // Test: Log canvas focus state
        console.log('[DEBUG] Canvas tabindex:', this.canvas.getAttribute('tabindex'));
        console.log('[DEBUG] Initial document.activeElement:', document.activeElement);

        // Keyboard event listeners
        window.addEventListener('keydown', (e) => {
            // #region agent log
            console.log('[DEBUG] keydown event:', {key: e.key, code: e.code, gameState: this.gameState, keyLength: e.key ? e.key.length : 0});
            fetch('http://127.0.0.1:7242/ingest/2e4625ef-98e5-48d8-a7ab-6d4230cfeb2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:keydown',message:'keydown event fired',data:{key:e.key,code:e.code,gameState:this.gameState,keyLength:e.key?e.key.length:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch((err)=>console.error('[DEBUG] Fetch error:', err));
            // #endregion
            
            const key = e.key || e.code;
            this.keys[e.key] = true;
            this.keys[e.code] = true; // Also track by code for Mac compatibility
            
            // Prevent default for game controls
            if (e.key === ' ' || e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
            }
            
            if (this.gameState === 'menu') {
                // #region agent log
                console.log('[DEBUG] gameState is menu, checking key:', {key: e.key, code: e.code, keyMatch: e.key === ' ', codeMatch: e.code === 'Space', enterMatch: e.key === 'Enter'});
                fetch('http://127.0.0.1:7242/ingest/2e4625ef-98e5-48d8-a7ab-6d4230cfeb2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:menu-check',message:'gameState is menu',data:{key:e.key,code:e.code,keyMatch:e.key===' ',codeMatch:e.code==='Space',enterMatch:e.key==='Enter'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'})}).catch((err)=>console.error('[DEBUG] Fetch error:', err));
                // #endregion
                
                if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
                    // #region agent log
                    console.log('[DEBUG] START CONDITION MATCHED! Calling startGame()');
                    fetch('http://127.0.0.1:7242/ingest/2e4625ef-98e5-48d8-a7ab-6d4230cfeb2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:start-trigger',message:'start condition matched',data:{key:e.key,code:e.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch((err)=>console.error('[DEBUG] Fetch error:', err));
                    // #endregion
                    
                    e.preventDefault();
                    e.stopPropagation();
                    this.startGame();
                }
            } else if (this.gameState === 'gameOver') {
                if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
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
            } else {
                // #region agent log
                console.log('[DEBUG] keydown in non-menu state:', {gameState: this.gameState, key: e.key, code: e.code});
                fetch('http://127.0.0.1:7242/ingest/2e4625ef-98e5-48d8-a7ab-6d4230cfeb2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:other-state',message:'keydown in non-menu state',data:{gameState:this.gameState,key:e.key,code:e.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch((err)=>console.error('[DEBUG] Fetch error:', err));
                // #endregion
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.keys[e.code] = false;
        });

        // Also listen on document for better Mac compatibility
        document.addEventListener('keydown', (e) => {
            // #region agent log
            console.log('[DEBUG] document keydown event:', {key: e.key, code: e.code, gameState: this.gameState});
            fetch('http://127.0.0.1:7242/ingest/2e4625ef-98e5-48d8-a7ab-6d4230cfeb2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:doc-keydown',message:'document keydown event fired',data:{key:e.key,code:e.code,gameState:this.gameState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch((err)=>console.error('[DEBUG] Fetch error:', err));
            // #endregion
            
            const key = e.key || e.code;
            this.keys[e.key] = true;
            this.keys[e.code] = true;
            
            // Prevent default for game controls
            if (e.key === ' ' || e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
            }
            
            if (this.gameState === 'menu') {
                // #region agent log
                console.log('[DEBUG] document: gameState is menu, checking key:', {key: e.key, code: e.code, keyMatch: e.key === ' ', codeMatch: e.code === 'Space'});
                fetch('http://127.0.0.1:7242/ingest/2e4625ef-98e5-48d8-a7ab-6d4230cfeb2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:doc-menu-check',message:'document: gameState is menu',data:{key:e.key,code:e.code,keyMatch:e.key===' ',codeMatch:e.code==='Space'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'})}).catch((err)=>console.error('[DEBUG] Fetch error:', err));
                // #endregion
                
                if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
                    // #region agent log
                    console.log('[DEBUG] document: START CONDITION MATCHED! Calling startGame()');
                    fetch('http://127.0.0.1:7242/ingest/2e4625ef-98e5-48d8-a7ab-6d4230cfeb2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:doc-start-trigger',message:'document: start condition matched',data:{key:e.key,code:e.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch((err)=>console.error('[DEBUG] Fetch error:', err));
                    // #endregion
                    
                    e.preventDefault();
                    e.stopPropagation();
                    this.startGame();
                }
            } else if (this.gameState === 'gameOver') {
                if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.restartGame();
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.setCanvasSize();
        });

        // Focus canvas when page loads
        window.addEventListener('load', () => {
            setTimeout(() => {
                console.log('[DEBUG] Attempting to focus canvas after load...');
                this.canvas.focus();
                console.log('[DEBUG] After focus attempt, document.activeElement:', document.activeElement);
            }, 100);
        });
        
        // Test: Add a global keydown listener that ALWAYS fires
        document.addEventListener('keydown', (e) => {
            console.log('[DEBUG] GLOBAL keydown listener fired:', {key: e.key, code: e.code, target: e.target, activeElement: document.activeElement});
        }, true); // Use capture phase

        // Start game loop
        this.gameLoop(0);
    }

    startGame() {
        // #region agent log
        console.log('[DEBUG] startGame() CALLED! Previous state:', this.gameState);
        fetch('http://127.0.0.1:7242/ingest/2e4625ef-98e5-48d8-a7ab-6d4230cfeb2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:startGame',message:'startGame() called',data:{previousState:this.gameState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch((err)=>console.error('[DEBUG] Fetch error:', err));
        // #endregion
        
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
    // #region agent log
    console.log('[DEBUG] window load event fired, creating Game');
    fetch('http://127.0.0.1:7242/ingest/2e4625ef-98e5-48d8-a7ab-6d4230cfeb2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.js:load',message:'window load event fired, creating Game',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch((err)=>console.error('[DEBUG] Fetch error:', err));
    // #endregion
    
    new Game();
});

