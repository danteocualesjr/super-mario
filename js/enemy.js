// Enemy classes (Goomba, Koopa)

class Enemy {
    constructor(x, y, type = 'goomba') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 32;
        this.height = 32;
        this.velocityX = type === 'goomba' ? -1.5 : -2;
        this.velocityY = 0;
        this.active = true;
        this.dead = false;
        this.deathTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        
        // Koopa specific
        this.inShell = false;
        this.shellTimer = 0;
        this.kicked = false;
    }

    update(physics, level, deltaTime) {
        if (!this.active) return;

        if (this.dead) {
            this.deathTimer--;
            if (this.deathTimer <= 0) {
                this.active = false;
            }
            return;
        }

        // Apply gravity
        physics.applyGravity(this, deltaTime);

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Check collision with level tiles
        const tileSize = level.tileSize;
        const enemyTileX = Math.floor(this.x / tileSize);
        const enemyTileY = Math.floor(this.y / tileSize);
        let onGround = false;

        // Check surrounding tiles
        for (let dy = -1; dy <= 2; dy++) {
            for (let dx = -1; dx <= 2; dx++) {
                const checkX = enemyTileX + dx;
                const checkY = enemyTileY + dy;
                
                if (checkX >= 0 && checkX < level.width && checkY >= 0 && checkY < level.height) {
                    const tile = level.getTile(checkX, checkY);
                    
                    if (tile && tile !== 0 && tile !== 'c' && tile !== 'm' && tile !== 'f') {
                        const tileRect = {
                            x: checkX * tileSize,
                            y: checkY * tileSize,
                            width: tileSize,
                            height: tileSize
                        };

                        const enemyRect = {
                            x: this.x,
                            y: this.y,
                            width: this.width,
                            height: this.height
                        };

                        if (physics.checkCollision(enemyRect, tileRect)) {
                            const side = physics.getCollisionSide(enemyRect, tileRect);
                            
                            if (side === 'bottom') {
                                onGround = true;
                                this.velocityY = 0;
                            } else if (side === 'top') {
                                this.velocityY = 0;
                            } else if (side === 'left' || side === 'right') {
                                // Turn around at walls
                                this.velocityX *= -1;
                            }
                            
                            physics.resolveCollision(this, tileRect);
                        }
                    }
                }
            }
        }

        // Turn around at edges or when hitting nothing
        if (onGround) {
            const checkAheadX = Math.floor((this.x + (this.velocityX > 0 ? this.width + 5 : -5)) / tileSize);
            const checkAheadY = Math.floor((this.y + this.height + 1) / tileSize);
            
            if (checkAheadX < 0 || checkAheadX >= level.width || 
                !level.getTile(checkAheadX, checkAheadY) || 
                level.getTile(checkAheadX, checkAheadY) === 0 ||
                level.getTile(checkAheadX, checkAheadY) === 'c' ||
                level.getTile(checkAheadX, checkAheadY) === 'm' ||
                level.getTile(checkAheadX, checkAheadY) === 'f') {
                this.velocityX *= -1;
            }
        }

        // Keep in bounds
        if (this.x < 0) {
            this.velocityX = Math.abs(this.velocityX);
        }
        if (this.x + this.width > level.width * tileSize) {
            this.velocityX = -Math.abs(this.velocityX);
        }

        // Update animation
        this.animTimer += deltaTime;
        if (this.animTimer > 0.2) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.animTimer = 0;
        }

        // Koopa shell timer
        if (this.inShell && !this.kicked) {
            this.shellTimer++;
            if (this.shellTimer > 300) {
                // Come out of shell
                this.inShell = false;
                this.height = 32;
                this.velocityX = Math.random() > 0.5 ? 2 : -2;
            }
        }
    }

    hitFromAbove() {
        if (this.type === 'koopa' && !this.inShell) {
            // Go into shell
            this.inShell = true;
            this.height = 16;
            this.velocityX = 0;
            this.shellTimer = 0;
            return 100; // Points for hitting Koopa
        } else if (this.type === 'koopa' && this.inShell && !this.kicked) {
            // Kick shell
            this.kicked = true;
            this.velocityX = 5;
            return 0;
        } else {
            // Defeated
            this.dead = true;
            this.deathTimer = 10;
            this.velocityY = -5;
            this.velocityX = 0;
            return 100; // Points for defeating Goomba
        }
    }

    hitFromSide() {
        if (this.type === 'koopa' && this.inShell && this.kicked) {
            // Hit by moving shell
            this.active = false;
            return 200; // Bonus points
        } else if (!this.inShell) {
            // Take damage
            return -1; // Player takes damage
        }
        return 0;
    }

    draw(ctx, camera) {
        if (!this.active) return;

        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;

        if (this.dead) {
            // Squished animation
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(drawX + 8, drawY + this.height - 4, 16, 4);
            return;
        }

        if (this.type === 'goomba') {
            // Draw Goomba
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(drawX + 4, drawY + 20, 24, 12);
            
            // Head
            ctx.fillStyle = '#654321';
            ctx.beginPath();
            ctx.ellipse(drawX + 16, drawY + 12, 12, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#000';
            const eyeOffset = this.animFrame === 0 ? 0 : 1;
            ctx.fillRect(drawX + 10 + eyeOffset, drawY + 8, 4, 4);
            ctx.fillRect(drawX + 18 + eyeOffset, drawY + 8, 4, 4);
        } else if (this.type === 'koopa') {
            if (this.inShell) {
                // Draw shell
                ctx.fillStyle = '#228B22';
                ctx.fillRect(drawX + 4, drawY + this.height - 16, 24, 16);
                
                // Shell pattern
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(drawX + 8, drawY + this.height - 12, 16, 8);
                
                // Shell dots
                ctx.fillStyle = '#000';
                ctx.fillRect(drawX + 12, drawY + this.height - 10, 2, 2);
                ctx.fillRect(drawX + 18, drawY + this.height - 10, 2, 2);
            } else {
                // Draw Koopa
                ctx.fillStyle = '#228B22';
                // Body
                ctx.fillRect(drawX + 6, drawY + 16, 20, 16);
                // Head
                ctx.fillRect(drawX + 4, drawY + 8, 24, 12);
                
                // Shell on back
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(drawX + 8, drawY + 12, 16, 12);
                
                // Eyes
                ctx.fillStyle = '#000';
                ctx.fillRect(drawX + 8, drawY + 10, 4, 4);
                ctx.fillRect(drawX + 20, drawY + 10, 4, 4);
            }
        }
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

