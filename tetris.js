const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restart');

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = {
  I: '#46f0f5',
  O: '#f5de46',
  T: '#b946f5',
  S: '#46f57f',
  Z: '#f54655',
  J: '#4670f5',
  L: '#f5a146',
};

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};

let board;
let active;
let score;
let lines;
let gameOver;
let dropInterval;
let lastTime;
let dropAccumulator;

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece() {
  const keys = Object.keys(SHAPES);
  const type = keys[Math.floor(Math.random() * keys.length)];
  const shape = SHAPES[type].map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0,
  };
}

function rotate(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      rotated[x][rows - 1 - y] = shape[y][x];
    }
  }
  return rotated;
}

function collide(piece, offsetX = 0, offsetY = 0, testShape = piece.shape) {
  for (let y = 0; y < testShape.length; y += 1) {
    for (let x = 0; x < testShape[y].length; x += 1) {
      if (!testShape[y][x]) continue;
      const nx = piece.x + x + offsetX;
      const ny = piece.y + y + offsetY;

      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function mergePiece() {
  active.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        board[active.y + y][active.x + x] = active.type;
      }
    });
  });
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (board[y].every((cell) => cell !== null)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared += 1;
      y += 1;
    }
  }

  if (cleared > 0) {
    lines += cleared;
    score += [0, 100, 300, 500, 800][cleared] || cleared * 200;
    linesEl.textContent = String(lines);
    scoreEl.textContent = String(score);
  }
}

function spawnPiece() {
  active = randomPiece();
  if (collide(active)) {
    gameOver = true;
    statusEl.textContent = 'ゲームオーバー';
  }
}

function dropOne() {
  if (!collide(active, 0, 1)) {
    active.y += 1;
    return;
  }

  mergePiece();
  clearLines();
  spawnPiece();
}

function hardDrop() {
  while (!collide(active, 0, 1)) {
    active.y += 1;
  }
  dropOne();
}

function move(dx) {
  if (!collide(active, dx, 0)) {
    active.x += dx;
  }
}

function spin() {
  const rotated = rotate(active.shape);
  if (!collide(active, 0, 0, rotated)) {
    active.shape = rotated;
    return;
  }

  if (!collide(active, -1, 0, rotated)) {
    active.x -= 1;
    active.shape = rotated;
    return;
  }

  if (!collide(active, 1, 0, rotated)) {
    active.x += 1;
    active.shape = rotated;
  }
}

function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const cell = board[y][x];
      if (cell) {
        drawBlock(x, y, COLORS[cell]);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
      }
    }
  }

  active.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) drawBlock(active.x + x, active.y + y, COLORS[active.type]);
    });
  });
}

function gameLoop(timestamp = 0) {
  if (gameOver) {
    draw();
    return;
  }

  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  dropAccumulator += delta;

  if (dropAccumulator >= dropInterval) {
    dropOne();
    dropAccumulator = 0;
  }

  draw();
  requestAnimationFrame(gameLoop);
}

function reset() {
  board = createBoard();
  score = 0;
  lines = 0;
  gameOver = false;
  dropInterval = 700;
  lastTime = 0;
  dropAccumulator = 0;
  scoreEl.textContent = '0';
  linesEl.textContent = '0';
  statusEl.textContent = '';
  spawnPiece();
  draw();
  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (event) => {
  if (gameOver) return;

  if (event.key === 'ArrowLeft') {
    move(-1);
  } else if (event.key === 'ArrowRight') {
    move(1);
  } else if (event.key === 'ArrowDown') {
    dropOne();
  } else if (event.key === 'ArrowUp') {
    spin();
  } else if (event.key === ' ') {
    event.preventDefault();
    hardDrop();
  }

  draw();
});

restartBtn.addEventListener('click', reset);

reset();
