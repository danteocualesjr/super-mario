// Player (Mario) class

class Player {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpPower = -15;
        this.onGround = false;
        this.facingRight = true;
        
        // Power-up states: 'small', 'big', 'fire'
        this.powerState = 'small';
        this.invulnerable = false;
        this.invulnerableTime = 0;
        
        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
        this.isMoving = false;
        
        // Fireball shooting
        this.fireballs = [];
        this.canShoot = true;
        this.shootCooldown = 0;
    }

    update(keys, physics, level, deltaTime) {
        // Handle input
        this.isMoving = false;
        
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.velocityX = -this.speed;
            this.facingRight = false;
            this.isMoving = true;
        } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.velocityX = this.speed;
            this.facingRight = true;
            this.isMoving = true;
        } else {
            physics.applyFriction(this);
        }

        if ((keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' ']) && this.onGround) {
            this.velocityY = this.jumpPower;
            this.onGround = false;
        }

        // Fireball shooting
        if ((keys['x'] || keys['X']) && this.powerState === 'fire' && this.canShoot && this.shootCooldown <= 0) {
            this.shootFireball();
            this.shootCooldown = 20;
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        // Apply gravity
        physics.applyGravity(this, deltaTime);

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Check collision with level tiles
        this.onGround = false;
        const tileSize = level.tileSize;
        const playerTileX = Math.floor(this.x / tileSize);
        const playerTileY = Math.floor(this.y / tileSize);

        // Check surrounding tiles
        for (let dy = -1; dy <= 2; dy++) {
            for (let dx = -1; dx <= 2; dx++) {
                const checkX = playerTileX + dx;
                const checkY = playerTileY + dy;
                
                if (checkX >= 0 && checkX < level.width && checkY >= 0 && checkY < level.height) {
                    const tile = level.getTile(checkX, checkY);
                    
                    if (tile && tile !== 0 && tile !== 'c' && tile !== 'm' && tile !== 'f') {
                        const tileRect = {
                            x: checkX * tileSize,
                            y: checkY * tileSize,
                            width: tileSize,
                            height: tileSize
                        };

                        const playerRect = {
                            x: this.x,
                            y: this.y,
                            width: this.width,
                            height: this.height
                        };

                        if (physics.checkCollision(playerRect, tileRect)) {
                            const side = physics.getCollisionSide(playerRect, tileRect);
                            
                            if (side === 'bottom') {
                                this.onGround = true;
                                this.velocityY = 0;
                            } else if (side === 'top') {
                                this.velocityY = 0;
                            } else if (side === 'left' || side === 'right') {
                                this.velocityX = 0;
                            }
                            
                            physics.resolveCollision(this, tileRect);
                        }
                    }
                }
            }
        }

        // Keep player in bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > level.width * tileSize) {
            this.x = level.width * tileSize - this.width;
        }

        // Update animation
        if (this.isMoving) {
            this.animTimer += deltaTime;
            if (this.animTimer > 0.15) {
                this.animFrame = (this.animFrame + 1) % 4;
                this.animTimer = 0;
            }
        } else {
            this.animFrame = 0;
        }

        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTime--;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }

        // Update fireballs
        this.fireballs = this.fireballs.filter(fireball => {
            fireball.update(deltaTime);
            return fireball.active && fireball.x > -100 && fireball.x < level.width * tileSize + 100;
        });
    }

    shootFireball() {
        const direction = this.facingRight ? 1 : -1;
        this.fireballs.push(new Fireball(
            this.x + (this.facingRight ? this.width : 0),
            this.y + this.height / 2,
            direction
        ));
    }

    takeDamage() {
        if (this.invulnerable) return false;

        if (this.powerState === 'fire') {
            this.powerState = 'big';
            this.invulnerable = true;
            this.invulnerableTime = 120;
            return false; // Not dead, just downgraded
        } else if (this.powerState === 'big') {
            this.powerState = 'small';
            this.invulnerable = true;
            this.invulnerableTime = 120;
            return false; // Not dead, just downgraded
        } else {
            return true; // Dead
        }
    }

    powerUp(type) {
        if (type === 'mushroom' && this.powerState === 'small') {
            this.powerState = 'big';
            this.height = 48;
            return true;
        } else if (type === 'fire' && this.powerState !== 'fire') {
            this.powerState = 'fire';
            this.height = 48;
            return true;
        }
        return false;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.powerState = 'small';
        this.height = 32;
        this.invulnerable = false;
        this.fireballs = [];
    }

    draw(ctx, camera) {
        // Draw fireballs first
        this.fireballs.forEach(fireball => fireball.draw(ctx, camera));

        // Draw player with invulnerability flashing
        if (!this.invulnerable || Math.floor(this.invulnerableTime / 5) % 2 === 0) {
            const drawX = this.x - camera.x;
            const drawY = this.y - camera.y;

            // Draw Mario based on power state
            ctx.fillStyle = this.powerState === 'fire' ? '#FF4500' : '#FF0000';
            
            // Body
            if (this.powerState === 'small') {
                // Small Mario
                ctx.fillRect(drawX + 8, drawY + 8, 16, 24);
                // Head
                ctx.fillStyle = '#FFA500';
                ctx.fillRect(drawX + 6, drawY, 20, 12);
                // Hat
                ctx.fillStyle = '#8B0000';
                ctx.fillRect(drawX + 4, drawY + 2, 24, 6);
            } else {
                // Big/Fire Mario
                ctx.fillRect(drawX + 6, drawY + 20, 20, 28);
                // Head
                ctx.fillStyle = '#FFA500';
                ctx.fillRect(drawX + 4, drawY + 8, 24, 16);
                // Hat
                ctx.fillStyle = '#8B0000';
                ctx.fillRect(drawX + 2, drawY + 10, 28, 8);
                
                if (this.powerState === 'fire') {
                    // Fire effect
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(drawX + 10, drawY + 12, 12, 4);
                }
            }

            // Face direction indicator
            if (!this.facingRight) {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.translate(-drawX - this.width, 0);
            }

            // Eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(drawX + (this.facingRight ? 10 : 18), drawY + (this.powerState === 'small' ? 4 : 12), 4, 4);
            ctx.fillRect(drawX + (this.facingRight ? 18 : 10), drawY + (this.powerState === 'small' ? 4 : 12), 4, 4);

            if (!this.facingRight) {
                ctx.restore();
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

// Fireball class
class Fireball {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;
        this.velocityX = direction * 8;
        this.velocityY = -2;
        this.active = true;
        this.bounceCount = 0;
    }

    update(deltaTime) {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += 0.5; // Gravity

        // Bounce on ground
        if (this.velocityY > 0 && this.bounceCount < 3) {
            // Will be checked in collision
        }
    }

    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;
        
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(drawX + this.width / 2, drawY + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(drawX + this.width / 2, drawY + this.height / 2, this.width / 3, 0, Math.PI * 2);
        ctx.fill();
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

