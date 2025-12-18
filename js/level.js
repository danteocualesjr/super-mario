// Level system with tile-based rendering

class Level {
    constructor(levelData) {
        this.tileSize = 32;
        this.width = levelData.width;
        this.height = levelData.height;
        this.tiles = levelData.tiles;
        this.enemies = [];
        this.collectibles = [];
        this.powerUps = [];
        this.startX = levelData.startX || 50;
        this.startY = levelData.startY || 100;
        this.endX = levelData.endX || this.width * this.tileSize - 50;
        
        // Parse level data
        this.parseLevelData(levelData);
    }

    parseLevelData(levelData) {
        // Initialize enemies and collectibles from level data
        if (levelData.enemies) {
            levelData.enemies.forEach(enemyData => {
                this.enemies.push(new Enemy(enemyData.x, enemyData.y, enemyData.type));
            });
        }

        if (levelData.collectibles) {
            levelData.collectibles.forEach(collectibleData => {
                this.collectibles.push({
                    x: collectibleData.x,
                    y: collectibleData.y,
                    type: collectibleData.type || 'coin',
                    collected: false,
                    animFrame: 0
                });
            });
        }

        if (levelData.powerUps) {
            levelData.powerUps.forEach(powerUpData => {
                this.powerUps.push({
                    x: powerUpData.x,
                    y: powerUpData.y,
                    type: powerUpData.type || 'mushroom',
                    collected: false,
                    velocityY: 0,
                    active: true
                });
            });
        }
    }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.tiles[y][x];
    }

    update(physics, player) {
        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy.active) {
                enemy.update(physics, this, 1);
            }
        });

        // Update power-ups (mushrooms move)
        this.powerUps.forEach(powerUp => {
            if (!powerUp.collected && powerUp.active && powerUp.type === 'mushroom') {
                physics.applyGravity(powerUp, 1);
                powerUp.y += powerUp.velocityY;
                powerUp.x += powerUp.type === 'mushroom' ? 1 : 0;

                // Check collision with tiles
                const tileX = Math.floor(powerUp.x / this.tileSize);
                const tileY = Math.floor(powerUp.y / this.tileSize);
                
                if (tileY >= 0 && tileY < this.height) {
                    const tile = this.getTile(tileX, tileY);
                    if (tile && tile !== 0 && tile !== 'c' && tile !== 'm' && tile !== 'f') {
                        powerUp.velocityY = 0;
                        powerUp.y = tileY * this.tileSize - 16;
                    }
                }

                // Turn around at edges
                if (powerUp.x < 0 || powerUp.x > this.width * this.tileSize) {
                    powerUp.active = false;
                }
            }
        });

        // Update collectible animations
        this.collectibles.forEach(collectible => {
            if (!collectible.collected) {
                collectible.animFrame = (collectible.animFrame + 0.1) % (Math.PI * 2);
            }
        });
    }

    draw(ctx, camera) {
        // Draw tiles
        const startTileX = Math.max(0, Math.floor(camera.x / this.tileSize) - 1);
        const endTileX = Math.min(this.width, Math.ceil((camera.x + camera.width) / this.tileSize) + 1);
        const startTileY = Math.max(0, Math.floor(camera.y / this.tileSize) - 1);
        const endTileY = Math.min(this.height, Math.ceil((camera.y + camera.height) / this.tileSize) + 1);

        for (let y = startTileY; y < endTileY; y++) {
            for (let x = startTileX; x < endTileX; x++) {
                const tile = this.tiles[y][x];
                const drawX = x * this.tileSize - camera.x;
                const drawY = y * this.tileSize - camera.y;

                if (tile === 1 || tile === 'g') {
                    // Ground/grass
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                    ctx.fillStyle = '#90EE90';
                    ctx.fillRect(drawX, drawY, this.tileSize, 4);
                } else if (tile === 2 || tile === 'b') {
                    // Brick
                    ctx.fillStyle = '#CD5C5C';
                    ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                    ctx.fillStyle = '#8B0000';
                    ctx.fillRect(drawX, drawY, this.tileSize, 2);
                    ctx.fillRect(drawX, drawY, 2, this.tileSize);
                } else if (tile === 3 || tile === 'q') {
                    // Question block
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                    ctx.fillStyle = '#FFA500';
                    ctx.fillRect(drawX + 4, drawY + 4, this.tileSize - 8, this.tileSize - 8);
                    ctx.fillStyle = '#000';
                    ctx.font = '16px Arial';
                    ctx.fillText('?', drawX + 10, drawY + 22);
                } else if (tile === 4 || tile === 'p') {
                    // Pipe
                    ctx.fillStyle = '#228B22';
                    ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                    ctx.fillStyle = '#32CD32';
                    ctx.fillRect(drawX + 4, drawY + 4, this.tileSize - 8, this.tileSize - 8);
                }
            }
        }

        // Draw collectibles
        this.collectibles.forEach(collectible => {
            if (!collectible.collected) {
                const drawX = collectible.x - camera.x;
                const drawY = collectible.y - camera.y + Math.sin(collectible.animFrame) * 3;
                
                if (collectible.type === 'coin') {
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.ellipse(drawX + 8, drawY + 8, 8, 10, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#FFA500';
                    ctx.beginPath();
                    ctx.ellipse(drawX + 8, drawY + 8, 6, 8, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });

        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            if (!powerUp.collected && powerUp.active) {
                const drawX = powerUp.x - camera.x;
                const drawY = powerUp.y - camera.y;
                
                if (powerUp.type === 'mushroom') {
                    // Mushroom
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(drawX + 4, drawY + 12, 16, 12);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(drawX + 6, drawY + 14, 12, 8);
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.ellipse(drawX + 12, drawY + 8, 10, 8, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.ellipse(drawX + 12, drawY + 8, 6, 5, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else if (powerUp.type === 'fire') {
                    // Fire flower
                    ctx.fillStyle = '#FF4500';
                    ctx.beginPath();
                    ctx.arc(drawX + 12, drawY + 12, 10, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(drawX + 12, drawY + 12, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(drawX + 10, drawY + 20, 4, 4);
                }
            }
        });

        // Draw enemies
        this.enemies.forEach(enemy => {
            if (enemy.active) {
                enemy.draw(ctx, camera);
            }
        });
    }

    checkCollectibleCollision(playerBounds) {
        let collected = null;
        this.collectibles.forEach(collectible => {
            if (!collectible.collected) {
                const collectibleRect = {
                    x: collectible.x,
                    y: collectible.y,
                    width: 16,
                    height: 16
                };
                
                if (this.checkCollision(playerBounds, collectibleRect)) {
                    collectible.collected = true;
                    collected = collectible;
                }
            }
        });
        return collected;
    }

    checkPowerUpCollision(playerBounds) {
        let collected = null;
        this.powerUps.forEach(powerUp => {
            if (!powerUp.collected && powerUp.active) {
                const powerUpRect = {
                    x: powerUp.x,
                    y: powerUp.y,
                    width: 16,
                    height: 16
                };
                
                if (this.checkCollision(playerBounds, powerUpRect)) {
                    powerUp.collected = true;
                    collected = powerUp;
                }
            }
        });
        return collected;
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
}

// Level data generator
function generateLevel(levelNum) {
    const width = 50;
    const height = 20;
    const tiles = [];
    
    // Initialize empty level
    for (let y = 0; y < height; y++) {
        tiles[y] = [];
        for (let x = 0; x < width; x++) {
            tiles[y][x] = 0;
        }
    }

    // Create ground
    const groundLevel = height - 3;
    for (let x = 0; x < width; x++) {
        tiles[groundLevel][x] = 1; // Ground
        tiles[groundLevel + 1][x] = 1; // Ground
        tiles[groundLevel + 2][x] = 1; // Ground
    }

    // Add platforms based on level
    if (levelNum === 1) {
        // Level 1: Simple platforms
        for (let x = 10; x < 15; x++) {
            tiles[groundLevel - 3][x] = 2; // Brick platform
        }
        for (let x = 20; x < 25; x++) {
            tiles[groundLevel - 5][x] = 2;
        }
        for (let x = 30; x < 35; x++) {
            tiles[groundLevel - 3][x] = 2;
        }
        
        // Question blocks
        tiles[groundLevel - 3][12] = 3;
        tiles[groundLevel - 5][22] = 3;
        
        // Enemies
        const enemies = [
            { x: 200, y: (groundLevel - 1) * 32, type: 'goomba' },
            { x: 400, y: (groundLevel - 1) * 32, type: 'goomba' },
            { x: 600, y: (groundLevel - 1) * 32, type: 'goomba' },
            { x: 800, y: (groundLevel - 6) * 32, type: 'koopa' }
        ];
        
        // Collectibles
        const collectibles = [
            { x: 350, y: (groundLevel - 4) * 32, type: 'coin' },
            { x: 450, y: (groundLevel - 6) * 32, type: 'coin' },
            { x: 550, y: (groundLevel - 4) * 32, type: 'coin' }
        ];
        
        // Power-ups
        const powerUps = [
            { x: 12 * 32, y: (groundLevel - 4) * 32, type: 'mushroom' },
            { x: 22 * 32, y: (groundLevel - 6) * 32, type: 'fire' }
        ];
        
        return {
            width,
            height,
            tiles,
            startX: 50,
            startY: (groundLevel - 1) * 32,
            endX: (width - 2) * 32,
            enemies,
            collectibles,
            powerUps
        };
    } else if (levelNum === 2) {
        // Level 2: More complex
        for (let x = 8; x < 12; x++) {
            tiles[groundLevel - 4][x] = 2;
        }
        for (let x = 18; x < 24; x++) {
            tiles[groundLevel - 6][x] = 2;
        }
        for (let x = 28; x < 32; x++) {
            tiles[groundLevel - 4][x] = 2;
        }
        for (let x = 38; x < 42; x++) {
            tiles[groundLevel - 7][x] = 2;
        }
        
        tiles[groundLevel - 4][10] = 3;
        tiles[groundLevel - 6][20] = 3;
        tiles[groundLevel - 7][40] = 3;
        
        const enemies = [
            { x: 250, y: (groundLevel - 1) * 32, type: 'goomba' },
            { x: 450, y: (groundLevel - 1) * 32, type: 'goomba' },
            { x: 500, y: (groundLevel - 7) * 32, type: 'koopa' },
            { x: 700, y: (groundLevel - 1) * 32, type: 'goomba' },
            { x: 900, y: (groundLevel - 1) * 32, type: 'koopa' }
        ];
        
        const collectibles = [
            { x: 300, y: (groundLevel - 5) * 32, type: 'coin' },
            { x: 400, y: (groundLevel - 7) * 32, type: 'coin' },
            { x: 500, y: (groundLevel - 5) * 32, type: 'coin' },
            { x: 600, y: (groundLevel - 5) * 32, type: 'coin' },
            { x: 800, y: (groundLevel - 8) * 32, type: 'coin' }
        ];
        
        const powerUps = [
            { x: 10 * 32, y: (groundLevel - 5) * 32, type: 'mushroom' },
            { x: 20 * 32, y: (groundLevel - 7) * 32, type: 'fire' }
        ];
        
        return {
            width,
            height,
            tiles,
            startX: 50,
            startY: (groundLevel - 1) * 32,
            endX: (width - 2) * 32,
            enemies,
            collectibles,
            powerUps
        };
    } else {
        // Level 3+: Procedural generation
        for (let i = 0; i < 8; i++) {
            const x = 5 + i * 6;
            const height = 3 + Math.floor(Math.random() * 4);
            const len = 3 + Math.floor(Math.random() * 3);
            for (let j = 0; j < len; j++) {
                if (x + j < width) {
                    tiles[groundLevel - height][x + j] = 2;
                }
            }
            if (Math.random() > 0.5 && x + 1 < width) {
                tiles[groundLevel - height - 1][x + 1] = 3;
            }
        }
        
        const enemies = [];
        for (let i = 0; i < 8 + levelNum; i++) {
            enemies.push({
                x: 200 + i * 150,
                y: (groundLevel - 1) * 32,
                type: Math.random() > 0.6 ? 'koopa' : 'goomba'
            });
        }
        
        const collectibles = [];
        for (let i = 0; i < 10; i++) {
            collectibles.push({
                x: 300 + i * 120,
                y: (groundLevel - 4 - Math.floor(Math.random() * 3)) * 32,
                type: 'coin'
            });
        }
        
        const powerUps = [
            { x: 15 * 32, y: (groundLevel - 4) * 32, type: 'mushroom' }
        ];
        
        return {
            width,
            height,
            tiles,
            startX: 50,
            startY: (groundLevel - 1) * 32,
            endX: (width - 2) * 32,
            enemies,
            collectibles,
            powerUps
        };
    }
}

