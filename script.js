const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PLAYER_RADIUS = 25;
const BULLET_SPEED = 10;
const ENEMY_SIZE = 40;
const ENEMY_SPEED_BASE = 1;
const SHOOT_COOLDOWN = 200;

let gameState = 'menu';
let score = 0;
let lives = 3;
let health = 5;
let difficulty = 1;
let lastShotTime = 0;
let enemies = [];
let bullets = [];
let keys = {};
let buttonRegions = [];

const player = {
  x: WIDTH / 2,
  y: HEIGHT - 100
};

document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  buttonRegions.forEach(button => {
    if (mx > button.x && mx < button.x + button.w && my > button.y && my < button.y + button.h) {
      button.callback();
    }
  });
});

function drawButton(text, x, y, w, h, callback) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + h / 2);
  buttonRegions.push({ x, y, w, h, callback });
}

function drawPlayer() {
  ctx.fillStyle = 'blue';
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.fillStyle = enemy.level === 1 ? 'green' : enemy.level === 2 ? 'yellow' : 'red';
    ctx.fillRect(enemy.x, enemy.y, ENEMY_SIZE, ENEMY_SIZE);
  });
}

function drawBullets() {
  ctx.fillStyle = 'black';
  bullets.forEach(b => {
    ctx.fillRect(b.x - 5, b.y, 10, 20);
  });
}

function drawHUD() {
  ctx.fillStyle = 'black';
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`Lives: ${lives}`, 20, 60);
  ctx.fillText(`Health: ${health}`, 20, 90);
  ctx.fillText(`Difficulty: ${difficulty}`, 20, 120);
}

function shootBullet() {
  const now = Date.now();
  if (now - lastShotTime >= SHOOT_COOLDOWN) {
    bullets.push({ x: player.x, y: player.y });
    lastShotTime = now;
  }
}

function spawnEnemy() {
  const level = Math.ceil(Math.random() * 3);
  const x = Math.random() * (WIDTH - ENEMY_SIZE);
  enemies.push({ x, y: -ENEMY_SIZE, level });
}

function updateGame() {
  if (keys['ArrowLeft']) player.x -= 5;
  if (keys['ArrowRight']) player.x += 5;
  if (keys['Space']) shootBullet();

  player.x = Math.max(PLAYER_RADIUS, Math.min(WIDTH - PLAYER_RADIUS, player.x));

  bullets = bullets.filter(b => b.y > -20);
  bullets.forEach(b => b.y -= BULLET_SPEED);

  enemies.forEach(e => e.y += ENEMY_SPEED_BASE * e.level * difficulty);
  enemies = enemies.filter(e => e.y < HEIGHT);

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (b.x > e.x && b.x < e.x + ENEMY_SIZE && b.y > e.y && b.y < e.y + ENEMY_SIZE) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score += 10;
        break;
      }
    }
    if (e.y + ENEMY_SIZE >= player.y - PLAYER_RADIUS &&
        e.x + ENEMY_SIZE > player.x - PLAYER_RADIUS &&
        e.x < player.x + PLAYER_RADIUS) {
      enemies.splice(i, 1);
      health--;
      if (health <= 0) {
        lives--;
        health = 5;
        if (lives <= 0) gameState = 'gameover';
      }
    }
  }
}

let lastEnemySpawn = Date.now();
let lastDifficultyIncrease = Date.now();

function loop() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  buttonRegions = [];

  if (gameState === 'menu') {
    ctx.fillStyle = 'black';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Shooter Game', WIDTH / 2, HEIGHT / 2 - 100);
    drawButton('Play', WIDTH / 2 - 100, HEIGHT / 2, 200, 50, () => gameState = 'playing');

  } else if (gameState === 'playing') {
    updateGame();
    drawPlayer();
    drawEnemies();
    drawBullets();
    drawHUD();

    if (Date.now() - lastEnemySpawn > 1000) {
      spawnEnemy();
      lastEnemySpawn = Date.now();
    }

    if (Date.now() - lastDifficultyIncrease > 10000) {
      difficulty++;
      lastDifficultyIncrease = Date.now();
    }
  } else if (gameState === 'gameover') {
    ctx.fillStyle = 'black';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 100);
    ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2 - 50);
    drawButton('Restart', WIDTH / 2 - 100, HEIGHT / 2 + 50, 200, 50, () => {
      score = 0;
      lives = 3;
      health = 5;
      enemies = [];
      bullets = [];
      difficulty = 1;
      player.x = WIDTH / 2;
      gameState = 'menu';
    });
  }

  requestAnimationFrame(loop);
}

loop();
