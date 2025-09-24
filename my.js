const canvas = document.getElementById("network");
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    
    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    
    const dots = [];
    const numDots = 150;

    for (let i = 0; i < numDots; i++) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (1 + Math.random() * 2),
        vy: (Math.random() - 0.5) * (1 + Math.random() * 2),
        radius: 3
      });
    }

    function drawDots() {
      ctx.fillStyle = "#4fc3f7";
      dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawLines() {
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) { 
            ctx.strokeStyle = `rgba(79, 195, 247, ${1 - dist / 150})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function updateDots() {
      dots.forEach(dot => {
        dot.x += dot.vx;
        dot.y += dot.vy;

        
        if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
        if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawDots();
      drawLines();
      updateDots();
      requestAnimationFrame(animate);
    }

    animate();



  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });

  window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });