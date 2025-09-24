(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // UI elements
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const restartBtn = document.getElementById('restart');
  const toggleSoundBtn = document.getElementById('toggleSound');

  // sizes
  const W = canvas.width;
  const H = canvas.height;
  const groundY = H - 30;

  // Game state
  let running = false;
  let playing = false;
  let speed = 6;
  let gravity = 0.9;
  let score = 0;
  let best = parseInt(localStorage.getItem('dino.best') || '0', 10);
  bestEl.textContent = best;

  // sound
  let soundOn = true;
  let audioCtx = null;
  function beep(freq=440, time=0.06, vol=0.12) {
    if(!soundOn) return;
    try{
      if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      setTimeout(()=>{ o.stop(); }, time*1000);
    }catch(e){}
  }

  // Load your photo
  const dinoImg = new Image();
  dinoImg.src = "Dinoo.png"; // replace with your file path

  const dino = {
    x: 40,
    y: groundY - 60,
    w: 60,
    h: 60,
    vy: 0,
    jumping: false,

    draw() {
      if (dinoImg.complete) {
        ctx.drawImage(dinoImg, this.x, this.y, this.w, this.h);
      } else {
        ctx.fillStyle = "#222";
        ctx.fillRect(this.x, this.y, this.w, this.h);
      }
    },

    update() {
      this.vy += gravity;
      this.y += this.vy;
      if (this.y >= groundY - this.h) {
        this.y = groundY - this.h;
        this.vy = 0;
        this.jumping = false;
      }
    },

    jump() {
      if (!this.jumping) {
        this.vy = -14;
        this.jumping = true;
      }
    },

    bounds() {
      return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
  };

  // Obstacles
  let obstacles = [];
  let spawnTimer = 0;

  function spawnObstacle() {
    const groupSize = Math.random() < 0.3 ? 2 : 1;
    for (let i = 0; i < groupSize; i++) {
      const widths = [14, 18, 22, 28, 34];
      const w = widths[Math.floor(Math.random()*widths.length)];
      const h = 20 + Math.floor(Math.random()*36);
      const obs = {
        x: W + 20 + (i * (w + 10)),
        y: groundY - h,
        w: w,
        h: h,
        draw() {
          ctx.fillStyle = '#2b6b2b';
          ctx.fillRect(this.x, this.y, this.w, this.h);
        },
        update() { this.x -= speed; }
      };
      obstacles.push(obs);
    }
  }

  // 🌥️ Clouds
  let clouds = [];
  let cloudTimer = 0;

  function spawnCloud() {
    const y = 40 + Math.random() * 100;
    const w = 40 + Math.random() * 40;
    const h = 20;
    const cloud = {
      x: W + 50,
      y: y,
      w: w,
      h: h,
      draw() {
        ctx.fillStyle = "#ccc";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.h, 0, Math.PI * 2);
        ctx.arc(this.x + this.h, this.y - 10, this.h * 0.8, 0, Math.PI * 2);
        ctx.arc(this.x + this.h * 2, this.y, this.h, 0, Math.PI * 2);
        ctx.fill();
      },
      update() {
        this.x -= speed * 0.4;
      }
    };
    clouds.push(cloud);
  }

  // 🐦 Birds
  let birds = [];
  let birdTimer = 0;

  const birdImg1 = new Image();
  birdImg1.src = "bird1.png";
  const birdImg2 = new Image();
  birdImg2.src = "bird2.png";

  function spawnBird() {
    const heights = [groundY - 20, groundY - 60, groundY - 100];
    const y = heights[Math.floor(Math.random() * heights.length)];
    const bird = {
      x: W + 40,
      y,
      w: 46,
      h: 36,
      frame: 0,
      frameTimer: 0,
      draw() {
        const img = this.frame === 0 ? birdImg1 : birdImg2;
        if (img.complete) {
          ctx.drawImage(img, this.x, this.y, this.w, this.h);
        } else {
          ctx.fillStyle = "#444";
          ctx.fillRect(this.x, this.y, this.w, this.h);
        }
      },
      update(dt) {
        this.x -= speed;
        this.frameTimer += dt;
        if (this.frameTimer > 10) {
          this.frame = (this.frame + 1) % 2;
          this.frameTimer = 0;
        }
      },
      bounds() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
      }
    };
    birds.push(bird);
  }

  function resetGame(){
    obstacles = [];
    clouds = [];
    birds = [];
    spawnTimer = 0;
    cloudTimer = 0;
    birdTimer = 0;
    score = 0;
    speed = 6;
    dino.y = groundY - dino.h;
    dino.vy = 0;
    dino.jumping = false;
    playing = true;
    running = true;
    scoreEl.textContent = score;
    requestAnimationFrame(loop);
  }

  function collide(a, b){
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
  }

  function gameOver() {
    running = false;
    playing = false;
    beep(200, 0.25, 0.16);
    if(score > best){ best = score; localStorage.setItem('dino.best', best); bestEl.textContent = best; }
    setTimeout(()=>{ drawGameOver(); }, 80);
  }

  // input handlers
  function keyDownHandler(e){
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if(!playing) { resetGame(); return; }
      dino.jump();
    } else if(e.code === 'KeyR'){
      resetGame();
    }
  }

  function touchStartHandler(e){
    e.preventDefault();
    if(!playing) { resetGame(); return; }
    dino.jump();
  }

  canvas.addEventListener('touchstart', touchStartHandler, {passive:false});
  canvas.addEventListener('mousedown', (e)=> {
    if(!playing) { resetGame(); return; }
    dino.jump();
  });

  window.addEventListener('keydown', keyDownHandler);
  restartBtn.addEventListener('click', ()=> resetGame());
  toggleSoundBtn.addEventListener('click', ()=>{
    soundOn = !soundOn;
    toggleSoundBtn.textContent = 'Sound: ' + (soundOn ? 'On' : 'Off');
  });

  // main loop
  let lastTime = 0;
  function loop(ts){
    if(!running) return;
    const dt = (ts - lastTime) / 16.666 || 1;
    lastTime = ts;

    dino.update();

    // Obstacles
    spawnTimer -= dt;
    if(spawnTimer <= 0){
      spawnObstacle();
      spawnTimer = (900 + Math.random()*700) / (1 + speed/12);
    }
    for(let i = obstacles.length-1; i>=0; i--){
      obstacles[i].update();
      if(obstacles[i].x + obstacles[i].w < -20) obstacles.splice(i,1);
    }

    // Clouds
    cloudTimer -= dt;
    if(cloudTimer <= 0){
      spawnCloud();
      cloudTimer = 300 + Math.random()*200;
    }
    for(let i = clouds.length-1; i>=0; i--){
      clouds[i].update();
      if(clouds[i].x + clouds[i].w < -50) clouds.splice(i,1);
    }

    // Birds
    birdTimer -= dt;
    if(birdTimer <= 0){
      if(Math.random() < 0.25) spawnBird();
      birdTimer = 400 + Math.random()*600;
    }
    for(let i = birds.length-1; i>=0; i--){
      birds[i].update(dt);
      if(birds[i].x + birds[i].w < -20) birds.splice(i,1);
    }

    // collisions
    for(const o of obstacles){ if(collide(dino.bounds(), o)) gameOver(); }
    for(const b of birds){ if(collide(dino.bounds(), b.bounds())) gameOver(); }

    score += Math.floor(0.25 * dt);
    scoreEl.textContent = score;
    speed = 6 + Math.floor(score/100) * 0.6;

    draw();
    if(running) requestAnimationFrame(loop);
  }

  function drawGround(offset){
    const tileW = 40;
    ctx.fillStyle = '#e6e6e6';
    for(let x = - (offset % tileW); x < W; x += tileW){
      ctx.fillRect(x, groundY, tileW - 10, 6);
    }
    ctx.fillStyle = '#ddd';
    ctx.fillRect(0, groundY+6, W, 4);
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0,0,W,H);

    // Clouds
    for(const c of clouds) c.draw();

    ctx.fillStyle = '#e9e9ea';
    ctx.fillRect(0, groundY, W, 2);
    drawGround(score*speed*0.02);

    for(const o of obstacles) o.draw();
    for(const b of birds) b.draw();
    dino.draw();
  }

  function drawGameOver(){
    draw();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '22px Inter, Arial';
    ctx.fillText('Game Over', W/2, H/2 - 8);
    ctx.font = '14px Inter, Arial';
    ctx.fillText('Press Space / Tap to restart', W/2, H/2 + 16);
  }

  canvas.addEventListener('click', ()=> canvas.focus());
  canvas.addEventListener('keydown', keyDownHandler);

  draw();
  ctx.font = '14px Inter, Arial';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.fillText('Click or press Space to start', 12, 18);

  window.DINO = { resetGame, spawnObstacle, obstacles, clouds, birds, dino };
  setTimeout(()=>canvas.focus(), 500);
})();
