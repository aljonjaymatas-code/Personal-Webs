(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // UI
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const restartBtn = document.getElementById('restart');
  const toggleSoundBtn = document.getElementById('toggleSound');

  const W = canvas.width;
  const H = canvas.height;
  const groundY = H - 40;

  // State
  let running = false, playing = false;
  let speed = 6, gravity = 0.9;
  let score = 0, best = parseInt(localStorage.getItem('forest.best') || '0', 10);
  bestEl.textContent = best;

  // Sound
  let soundOn = true;
  let audioCtx = null;
  function beep(freq = 440, time = 0.06, vol = 0.12) {
    if (!soundOn) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      setTimeout(() => o.stop(), time * 1000);
    } catch (e) {}
  }

  // Background
  const bgImg = new Image(); bgImg.src = "forest.png"; 
  let bgX = 0;

  // Dino
  const dinoImg = new Image(); dinoImg.src = "Dinoo.png";
  const dino = {
    x: 50, y: groundY - 60, w: 60, h: 60,
    vy: 0, jumping: false,
    speedX: 0, crouching: false,
    draw() {
      if (dinoImg.complete) {
        ctx.drawImage(dinoImg, this.x, this.y, this.w, this.h);
      } else {
        ctx.fillStyle = "#444"; ctx.fillRect(this.x, this.y, this.w, this.h);
      }
    },
    update() {
      // gravity
      this.vy += gravity;
      this.y += this.vy;

      // ground stop
      if (this.y >= groundY - this.h) {
        this.y = groundY - this.h; this.vy = 0; this.jumping = false;
      }

      // horizontal movement
      this.x += this.speedX;

      // keep inside canvas
      if (this.x < 0) this.x = 0;
      if (this.x + this.w > W) this.x = W - this.w;

      // crouch adjust
      if (this.crouching) {
        this.h = 35;
        this.y = groundY - this.h;
      } else {
        this.h = 60;
        this.y = Math.min(this.y, groundY - this.h);
      }
    },
    jump() { if (!this.jumping && !this.crouching) { this.vy = -14; this.jumping = true; } },
    bounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  };

  // Obstacles
let obstacles = [], spawnTimer = 0;
const obstacleImg = new Image();
obstacleImg.src = "spider.png"; // <-- replace with your generated image file name

function spawnObstacle() {
  const w = 30; // obstacle width
  const h = 25; // obstacle height
  obstacles.push({
    x: W + 20,
    y: groundY - h,
    w,
    h,
    draw() {
      if (obstacleImg.complete) {
        ctx.drawImage(obstacleImg, this.x, this.y, this.w, this.h);
      } else {
        ctx.fillStyle = "red"; // fallback rectangle
        ctx.fillRect(this.x, this.y, this.w, this.h);
      }
    },
    update() {
      this.x -= speed;
    },
    bounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  });
}


  // Reset Game
  function resetGame() {
    score = 0; speed = 6;
    dino.x = 50; dino.y = groundY - dino.h; dino.vy = 0; dino.jumping = false; dino.crouching = false;
    obstacles = []; spawnTimer = 0;
    playing = true; running = true; scoreEl.textContent = score;
    requestAnimationFrame(loop);
  }

  function collide(a, b) {
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
  }

  function gameOver() {
    running = false; playing = false; beep(200, 0.25, 0.16);
    if (score > best) { 
      best = score; 
      localStorage.setItem('forest.best', best); 
      bestEl.textContent = best; 
    }
    setTimeout(() => drawGameOver(), 80);
  }

  // Input
  const keys = {};
  function keyDownHandler(e) {
    keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (!playing) { resetGame(); return; }
      dino.jump();
    }
    if (e.code === 'ArrowDown') {
      dino.crouching = true;
    }
  }
  function keyUpHandler(e) {
    keys[e.code] = false;
    if (e.code === 'ArrowDown') {
      dino.crouching = false;
    }
  }

  // Key events
  window.addEventListener('keydown', keyDownHandler);
  window.addEventListener('keyup', keyUpHandler);

  canvas.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    if (!playing) resetGame(); 
    else dino.jump(); 
  }, { passive: false });

  restartBtn.addEventListener('click', () => {
    if (!playing) resetGame();
  });

  toggleSoundBtn.addEventListener('click', () => { 
    soundOn = !soundOn; 
    toggleSoundBtn.textContent = 'Sound: ' + (soundOn ? 'On' : 'Off'); 
  });

  // Main loop
  let lastTime = 0;
  function loop(ts) {
    if (!running) return;
    const dt = (ts - lastTime) / 16.666 || 1; lastTime = ts;

    dino.update();

    // Move left/right
    if (keys['ArrowLeft']) dino.speedX = -5;
    else if (keys['ArrowRight']) dino.speedX = 5;
    else dino.speedX = 0;

    // Spawn obstacles
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 100 + Math.random() * 120;
    }
    obstacles = obstacles.filter(o => { o.update(); return o.x + o.w > -20; });

    // Collision check + scoring
    for (const o of obstacles) {
      if (collide(dino.bounds(), o.bounds())) gameOver();
      // Score: jump over obstacle
      if (!o.passed && o.x + o.w < dino.x) {
        o.passed = true;
        score++;
        scoreEl.textContent = score;
        beep(660, 0.05, 0.1);
      }
    }

    // Background scrolling
    bgX -= speed * 0.2; if (bgX <= -W) bgX = 0;

    draw();
    if (running) requestAnimationFrame(loop);
  }

  // Draw3
  function draw() {
    ctx.clearRect(0, 0, W, H);

    if (bgImg.complete) {
      ctx.drawImage(bgImg, bgX, 0, W, H);
      ctx.drawImage(bgImg, bgX + W, 0, W, H);
    } else {
      ctx.fillStyle = "#87CEEB"; ctx.fillRect(0, 0, W, H);
    }

    for (const o of obstacles) o.draw();
    dino.draw();
  }

  function drawGameOver() {
    draw();
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'white'; ctx.textAlign = 'center';
    ctx.font = '22px Arial'; ctx.fillText('Game Over', W / 2, H / 2 - 8);
    ctx.font = '14px Arial'; ctx.fillText('Press Space / Tap to restart', W / 2, H / 2 + 16);
  }

  draw();
  ctx.font = '14px Arial'; ctx.fillStyle = '#fff'; ctx.fillText('Click or press Space to start', 12, 18);
})();