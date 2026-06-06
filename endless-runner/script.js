// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game states
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

// Game variables
let gameState = GAME_STATE.MENU;
let distance = 0;
let gameSpeed = 8;
const maxGameSpeed = 15;
const gameSpeedIncrease = 0.001;

// Player object
const player = {
    x: canvas.width / 4,
    y: canvas.height - 100,
    width: 30,
    height: 50,
    velocityY: 0,
    isJumping: false,
    isSliding: false,
    slideDuration: 0,
    maxSlideDuration: 20,
    jumpPower: 15,
    gravity: 0.6,
    maxVelocityY: 20
};

// Ground level
const groundLevel = canvas.height - 80;

// Obstacles array
let obstacles = [];
let nextObstacleDistance = 80;
const minObstacleDistance = 50;
const maxObstacleDistance = 150;

// Background layers for parallax
const bgLayers = [
    { y: 0, speed: 0.5, color: 'rgba(15, 15, 46, 0.6)', height: canvas.height },
    { y: 0, speed: 1, color: 'rgba(10, 14, 39, 0.4)', height: canvas.height }
];

// Event listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('click', handleCanvasClick);
window.addEventListener('resize', handleWindowResize);
document.getElementById('restartButton').addEventListener('click', restartGame);
document.getElementById('instructions').addEventListener('click', startGame);

// Input handling
const keys = {};

function handleKeyDown(e) {
    keys[e.key] = true;

    if (gameState === GAME_STATE.MENU && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        startGame();
    }

    if (gameState === GAME_STATE.PLAYING) {
        if (e.key === ' ') {
            e.preventDefault();
            jump();
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            slide();
        }
    }
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

function handleCanvasClick() {
    if (gameState === GAME_STATE.MENU) {
        startGame();
    } else if (gameState === GAME_STATE.PLAYING) {
        jump();
    }
}

function handleWindowResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Game functions
function startGame() {
    gameState = GAME_STATE.PLAYING;
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('gameOverScreen').classList.remove('active');
    distance = 0;
    gameSpeed = 8;
    player.isJumping = false;
    player.isSliding = false;
    player.velocityY = 0;
    player.y = groundLevel;
    obstacles = [];
    nextObstacleDistance = 80;
}

function restartGame() {
    startGame();
}

function jump() {
    if (gameState !== GAME_STATE.PLAYING) return;
    if (!player.isJumping && !player.isSliding) {
        player.isJumping = true;
        player.velocityY = -player.jumpPower;
    }
}

function slide() {
    if (gameState !== GAME_STATE.PLAYING) return;
    if (!player.isJumping && !player.isSliding) {
        player.isSliding = true;
        player.slideDuration = player.maxSlideDuration;
    }
}

function generateObstacle() {
    const obstacleType = Math.random() > 0.5 ? 'crate' : 'bar';
    
    let obstacle = {
        x: canvas.width,
        width: 40,
        type: obstacleType
    };

    if (obstacleType === 'crate') {
        obstacle.y = groundLevel - 50;
        obstacle.height = 50;
        obstacle.color = '#ff00ff';
    } else {
        obstacle.y = groundLevel - 25;
        obstacle.height = 20;
        obstacle.color = '#00ff00';
    }

    obstacles.push(obstacle);
}

function update() {
    if (gameState !== GAME_STATE.PLAYING) return;

    // Increase game speed gradually
    gameSpeed = Math.min(gameSpeed + gameSpeedIncrease, maxGameSpeed);

    // Update distance
    distance += gameSpeed * 0.1;
    document.getElementById('distance').textContent = Math.floor(distance);

    // Player physics
    player.velocityY += player.gravity;
    player.velocityY = Math.min(player.velocityY, player.maxVelocityY);
    player.y += player.velocityY;

    // Ground collision
    if (player.y + player.height >= groundLevel) {
        player.y = groundLevel - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }

    // Sliding logic
    if (player.isSliding) {
        player.slideDuration--;
        if (player.slideDuration <= 0) {
            player.isSliding = false;
        }
    }

    // Generate obstacles
    if (distance >= nextObstacleDistance) {
        generateObstacle();
        nextObstacleDistance += Math.random() * (maxObstacleDistance - minObstacleDistance) + minObstacleDistance;
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;

        // Remove off-screen obstacles
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        } else {
            // Collision detection
            checkCollision(obstacles[i]);
        }
    }

    // Update parallax background
    for (let layer of bgLayers) {
        layer.y += gameSpeed * layer.speed;
        if (layer.y > canvas.height) {
            layer.y = 0;
        }
    }
}

function checkCollision(obstacle) {
    let playerLeft = player.x;
    let playerRight = player.x + player.width;
    let playerTop = player.y;
    let playerBottom = player.y + player.height;

    let obstacleLeft = obstacle.x;
    let obstacleRight = obstacle.x + obstacle.width;
    let obstacleTop = obstacle.y;
    let obstacleBottom = obstacle.y + obstacle.height;

    // Adjust hitbox for sliding
    if (player.isSliding) {
        playerTop = player.y + 20;
    }

    // Check collision
    if (playerLeft < obstacleRight &&
        playerRight > obstacleLeft &&
        playerTop < obstacleBottom &&
        playerBottom > obstacleTop) {
        
        endGame();
    }
}

function endGame() {
    gameState = GAME_STATE.GAME_OVER;
    document.getElementById('finalScore').textContent = Math.floor(distance);
    document.getElementById('gameOverScreen').classList.add('active');
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw parallax background
    drawParallaxBackground();

    // Draw ground
    drawGround();

    // Draw player
    drawPlayer();

    // Draw obstacles
    for (let obstacle of obstacles) {
        drawObstacle(obstacle);
    }

    // Draw HUD
    if (gameState === GAME_STATE.PLAYING) {
        drawHUD();
    }
}

function drawParallaxBackground() {
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0e27');
    gradient.addColorStop(0.5, '#1a1a3e');
    gradient.addColorStop(1, '#0f0f2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw animated grid lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    const gridSpacing = 50;
    const offset = (distance * gameSpeed * 0.5) % gridSpacing;

    for (let i = -offset; i < canvas.width; i += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }

    // Draw horizontal lines for depth
    for (let i = 0; i < canvas.height; i += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

function drawGround() {
    // Ground line
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundLevel);
    ctx.lineTo(canvas.width, groundLevel);
    ctx.stroke();

    // Ground glow
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, groundLevel);
    ctx.lineTo(canvas.width, groundLevel);
    ctx.stroke();

    // Ground fill
    ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
    ctx.fillRect(0, groundLevel, canvas.width, canvas.height - groundLevel);
}

function drawPlayer() {
    ctx.save();

    // Player body
    const bodyWidth = player.isSliding ? player.width * 2 : player.width;
    const bodyHeight = player.isSliding ? player.height / 2 : player.height;
    const bodyX = player.x - (player.isSliding ? player.width / 2 : 0);
    const bodyY = player.y + (player.isSliding ? player.height / 2 : 0);

    // Main body - neon cyan
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.shadowBlur = 20;
    ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);

    // Body glow
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(bodyX, bodyY, bodyWidth, bodyHeight);

    // Head (if not sliding)
    if (!player.isSliding) {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y - 5, 8, 0, Math.PI * 2);
        ctx.fill();

        // Eyes - neon magenta
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(player.x + 7, player.y - 8, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(player.x + 23, player.y - 8, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Legs/Motion lines when running
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    if (!player.isSliding) {
        const legOffset = (distance * 0.05) % 10;
        ctx.beginPath();
        ctx.moveTo(bodyX + 5, bodyY + bodyHeight);
        ctx.lineTo(bodyX + 5, bodyY + bodyHeight + 15 - (legOffset % 10));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bodyX + bodyWidth - 5, bodyY + bodyHeight);
        ctx.lineTo(bodyX + bodyWidth - 5, bodyY + bodyHeight + 15 - ((legOffset + 5) % 10));
        ctx.stroke();
    }

    ctx.restore();
}

function drawObstacle(obstacle) {
    ctx.save();

    if (obstacle.type === 'crate') {
        // Crate - magenta box
        ctx.fillStyle = '#ff00ff';
        ctx.shadowColor = 'rgba(255, 0, 255, 0.8)';
        ctx.shadowBlur = 15;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // Crate outline
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // Crate pattern
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
        ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.y + obstacle.height / 2);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height / 2);
        ctx.stroke();
    } else {
        // Bar - cyan line
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
        ctx.shadowBlur = 15;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // Bar glow
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    ctx.restore();
}

function drawHUD() {
    // Speed indicator
    ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.fillRect(canvas.width - 150, 20, 130, 40);

    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 12px "Courier New"';
    ctx.fillText('SPEED', canvas.width - 145, 35);

    const speedPercent = (gameSpeed / maxGameSpeed) * 100;
    ctx.fillStyle = '#ff00ff';
    ctx.fillText(speedPercent.toFixed(0) + '%', canvas.width - 145, 55);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();

// Show instructions on load
window.addEventListener('load', () => {
    document.getElementById('instructions').style.display = 'block';
});
