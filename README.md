# Super Mario Retro Game

A classic Super Mario-style retro game built with HTML5 Canvas and vanilla JavaScript.

## Features

- **Classic Mario Gameplay**: Run, jump, and collect coins
- **Multiple Enemies**: Goombas and Koopa Troopas with AI
- **Power-ups**: Mushroom (grow big) and Fire Flower (shoot fireballs)
- **Multiple Levels**: Procedurally generated levels with increasing difficulty
- **Score System**: Earn points for coins, enemies, and power-ups
- **Lives System**: Start with 3 lives
- **Sound Effects**: Web Audio API generated sounds
- **High Score**: Saved to browser localStorage

## Controls

- **Arrow Keys** or **WASD**: Move left/right
- **Space** or **Up Arrow** or **W**: Jump
- **X**: Shoot fireball (when powered up with fire flower)
- **P**: Pause/Resume game
- **Space/Enter**: Start game or restart after game over

## How to Play

1. Open `index.html` in a web browser
2. Press **Space** or **Enter** to start
3. Move with arrow keys or WASD
4. Jump on enemies to defeat them
5. Collect coins and power-ups
6. Reach the end of each level to progress
7. Avoid falling off the map or getting hit by enemies

## Game Mechanics

### Power-ups
- **Mushroom**: Makes Mario grow bigger (can take one hit without dying)
- **Fire Flower**: Allows Mario to shoot fireballs and take two hits

### Enemies
- **Goomba**: Basic enemy, defeated by jumping on it
- **Koopa Troopa**: Can be jumped on to go into shell, then kicked for bonus points

### Scoring
- Coin: 100 points
- Goomba defeat: 100 points
- Koopa defeat: 100 points
- Kicked shell hit: 200 points
- Power-up: 500 points

## Technical Details

- Built with vanilla JavaScript (no frameworks)
- Uses HTML5 Canvas for rendering
- Web Audio API for sound effects
- AABB collision detection
- Tile-based level system
- Camera follows player

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- Web Audio API
- ES6 JavaScript

Enjoy the game!
