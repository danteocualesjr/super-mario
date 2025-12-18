// Physics engine for collision detection and physics calculations

class Physics {
    constructor() {
        this.gravity = 0.8;
        this.friction = 0.85;
    }

    // AABB (Axis-Aligned Bounding Box) collision detection
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    // Check if point is inside rectangle
    pointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }

    // Get collision side (top, bottom, left, right)
    getCollisionSide(rect1, rect2) {
        const overlapX = Math.min(rect1.x + rect1.width - rect2.x, rect2.x + rect2.width - rect1.x);
        const overlapY = Math.min(rect1.y + rect1.height - rect2.y, rect2.y + rect2.height - rect1.y);

        if (overlapX < overlapY) {
            return rect1.x < rect2.x ? 'left' : 'right';
        } else {
            return rect1.y < rect2.y ? 'top' : 'bottom';
        }
    }

    // Resolve collision by moving object out of collision
    resolveCollision(moving, staticObj) {
        const side = this.getCollisionSide(moving, staticObj);
        
        switch (side) {
            case 'top':
                moving.y = staticObj.y - moving.height;
                if (moving.velocityY !== undefined) {
                    moving.velocityY = 0;
                }
                break;
            case 'bottom':
                moving.y = staticObj.y + staticObj.height;
                if (moving.velocityY !== undefined) {
                    moving.velocityY = 0;
                }
                break;
            case 'left':
                moving.x = staticObj.x - moving.width;
                if (moving.velocityX !== undefined) {
                    moving.velocityX = 0;
                }
                break;
            case 'right':
                moving.x = staticObj.x + staticObj.width;
                if (moving.velocityX !== undefined) {
                    moving.velocityX = 0;
                }
                break;
        }
    }

    // Apply gravity to an object
    applyGravity(obj, deltaTime = 1) {
        if (obj.velocityY !== undefined) {
            obj.velocityY += this.gravity * deltaTime;
        }
    }

    // Apply friction to horizontal velocity
    applyFriction(obj) {
        if (obj.velocityX !== undefined) {
            obj.velocityX *= this.friction;
            if (Math.abs(obj.velocityX) < 0.1) {
                obj.velocityX = 0;
            }
        }
    }

    // Check tile collision (for platform tiles)
    checkTileCollision(obj, tileX, tileY, tileSize) {
        const tileRect = {
            x: tileX * tileSize,
            y: tileY * tileSize,
            width: tileSize,
            height: tileSize
        };

        const objRect = {
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height
        };

        return this.checkCollision(objRect, tileRect);
    }
}

