// Tower Game: Кликни, когда блок по центру!

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');
const restartBtn = document.getElementById('restart-btn');

let W = 360, H = 540;

function resizeCanvas() {
  const container = document.getElementById('game-container');
  let width = window.innerWidth;
  let height = window.innerHeight;
  width = Math.min(width, 420);
  height = Math.min(height, 700);
  // Вычитаем высоту бара
  let barHeight = window.innerWidth <= 500 ? 48 : 56;
  W = width;
  H = height - barHeight;
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
}

window.addEventListener('resize', () => {
  resizeCanvas();
  // Перерисовать башню после изменения размера
  if (typeof tower !== 'undefined' && typeof gameLoop === 'function') {
    gameLoop();
  }
});

resizeCanvas();

// Настройки башни
const BLOCK_W = 120;
const BLOCK_H = 28;
const BOTTOM_MARGIN = 20; // px, чтобы башня не была вплотную к низу
const SPEED_MIN = 1.1;
const SPEED_MAX = 1.7;
const CENTER_TOLERANCE = 18; // px
const AUTO_SNAP_TOLERANCE = 10; // px

let tower = [];
let movingBlock = null;
let isRunning = true;
let score = 0;
let bestScore = Number(localStorage.getItem('tower_best')) || 0;

function getRandomColor() {
  // Яркие насыщенные цвета
  const colors = [
    '#ff5252', '#ff9800', '#ffd600', '#69f0ae', '#00bcd4', '#448aff', '#7c4dff', '#e040fb', '#ff4081', '#ff1744', '#00e676', '#00bfae', '#2979ff', '#651fff', '#d500f9', '#ff80ab', '#ffea00', '#64dd17', '#1de9b6', '#00b8d4', '#304ffe', '#6200ea', '#c51162', '#ff3d00', '#aeea00', '#00bfae'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function updateScoreDisplay() {
  scoreDiv.textContent = `Счёт: ${score}  |  Рекорд: ${bestScore}`;
}

function startGame() {
  resizeCanvas();
  tower = [{ x: W/2, y: H - BLOCK_H/2 - BOTTOM_MARGIN, w: BLOCK_W, color: getRandomColor() }];
  score = 0;
  isRunning = true;
  spawnBlock();
  updateScoreDisplay();
  restartBtn.style.display = 'none';
  requestAnimationFrame(gameLoop);
}

function spawnBlock(width) {
  const dir = Math.random() < 0.5 ? 1 : -1;
  movingBlock = {
    x: dir === 1 ? 0 : W,
    y: H - BLOCK_H/2 - BLOCK_H * tower.length - BOTTOM_MARGIN,
    w: width || BLOCK_W,
    h: BLOCK_H,
    speed: (SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN)) * dir,
    dir
  };
}

canvas.onclick = () => {
  if (!isRunning) return;
  if (!movingBlock) return;
  // Проверяем перекрытие
  const prev = tower[tower.length - 1];
  const dx = Math.abs(movingBlock.x - prev.x);
  const overlap = prev.w - dx;
  if (overlap > 0) {
    // Есть перекрытие
    let newW = prev.w;
    let isPerfect = false;
    if (dx <= AUTO_SNAP_TOLERANCE) {
      movingBlock.x = prev.x;
      isPerfect = true;
      newW = prev.w;
    } else if (dx > 2) {
      newW = overlap;
      movingBlock.x = Math.max(prev.x - prev.w/2 + newW/2, Math.min(movingBlock.x, prev.x + prev.w/2 - newW/2));
    } else {
      isPerfect = true;
      movingBlock.x = Math.max(prev.x - prev.w/2 + newW/2, Math.min(movingBlock.x, prev.x + prev.w/2 - newW/2));
    }
    tower.push({ x: movingBlock.x, y: movingBlock.y, w: newW, color: getRandomColor() });
    score++;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('tower_best', bestScore);
    }
    updateScoreDisplay();
    if (isPerfect) {
      confetti({
        particleCount: 40 + Math.floor(Math.random() * 20),
        spread: 90 + Math.random() * 30,
        origin: { x: 0.5, y: (movingBlock.y + BLOCK_H/2) / H },
        colors: ['#ff5252','#ff9800','#ffd600','#69f0ae','#00bcd4','#448aff','#7c4dff','#e040fb','#ff4081','#ff1744','#00e676','#00bfae','#2979ff','#651fff','#d500f9','#ff80ab','#ffea00','#64dd17','#1de9b6','#00b8d4','#304ffe','#6200ea','#c51162','#ff3d00','#aeea00','#00bfae']
      });
    }
    spawnBlock(newW);
  } else {
    isRunning = false;
    restartBtn.style.display = 'inline-block';
    drawFail();
  }
};

restartBtn.onclick = startGame;

function gameLoop() {
  ctx.clearRect(0, 0, W, H);
  // Рисуем башню
  for (let b of tower) {
    drawBlock(b.x, b.y, b.w, BLOCK_H, b.color);
  }
  // Движущийся блок
  if (movingBlock && isRunning) {
    movingBlock.x += movingBlock.speed;
    if (movingBlock.x < movingBlock.w/2) {
      movingBlock.x = movingBlock.w/2;
      movingBlock.speed *= -1;
    }
    if (movingBlock.x > W - movingBlock.w/2) {
      movingBlock.x = W - movingBlock.w/2;
      movingBlock.speed *= -1;
    }
    drawBlock(movingBlock.x, movingBlock.y, movingBlock.w, movingBlock.h, '#3498db');
  } else if (movingBlock && !isRunning) {
    drawBlock(movingBlock.x, movingBlock.y, movingBlock.w, movingBlock.h, '#e74c3c');
  }
  if (isRunning) requestAnimationFrame(gameLoop);
}

function drawBlock(x, y, w, h, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.rect(-w/2, -h/2, w, h);
  ctx.fill();
  ctx.restore();
}

function drawFail() {
  ctx.save();
  ctx.font = 'bold 2em Segoe UI, Arial';
  ctx.fillStyle = '#e74c3c';
  ctx.textAlign = 'center';
  ctx.fillText('Промах!', W/2, H/2 - 30);
  ctx.restore();
}

startGame(); 