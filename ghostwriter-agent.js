/* ===== GHOSTWRITER AGENT — INTERACTIVE JS ===== */

(function () {
  'use strict';

  /* ---------- 1. CURSOR GLOW ---------- */
  const glow = document.getElementById('cursorGlow');
  let mouseX = -300, mouseY = -300;
  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
  (function renderGlow() {
    glow.style.left = mouseX + 'px';
    glow.style.top = mouseY + 'px';
    requestAnimationFrame(renderGlow);
  })();

  /* ---------- 2. HAMBURGER MENU ---------- */
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('open');
  }));

  /* ---------- 3. TICKER ---------- */
  const tickerMessages = [
    "✔ PR #87 healed — null check inserted · 2s ago",
    "⚡ PR #91 detected — TypeError · 5s ago",
    "✔ PR #88 merged — 3/3 checks · 12s ago",
    "🔍 PR #92 analyzing — missing import · 8s ago",
    "✔ PR #85 healed — syntax fix applied · 18s ago",
    "⚡ PR #93 detected — undefined variable · 1s ago",
    "✔ PR #84 merged — test suite green · 25s ago",
    "🛡️ PR #90 sandboxed — Docker isolation active · 3s ago"
  ];
  const track = document.getElementById('tickerTrack');
  const tickerHTML = tickerMessages.map(m => `<span class="ticker-item">${m}</span>`).join('');
  track.innerHTML = tickerHTML + tickerHTML; // duplicate for infinite loop

  /* ---------- 4. MATRIX CANVAS ---------- */
  const canvas = document.getElementById('matrixCanvas');
  const ctx = canvas.getContext('2d');
  let cols, drops;
  function initMatrix() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const fontSize = 12;
    cols = Math.floor(canvas.width / fontSize);
    drops = Array.from({ length: cols }, () => Math.random() * -100);
  }
  initMatrix();
  window.addEventListener('resize', initMatrix);
  const hexChars = '0123456789ABCDEF01';
  function drawMatrix() {
    ctx.fillStyle = 'rgba(8,11,15,0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff88';
    ctx.font = '12px JetBrains Mono, monospace';
    for (let i = 0; i < cols; i++) {
      const char = hexChars[Math.floor(Math.random() * hexChars.length)];
      const x = i * 12;
      const y = drops[i] * 12;
      ctx.fillText(char, x, y);
      if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.4 + Math.random() * 0.6;
    }
    requestAnimationFrame(drawMatrix);
  }
  drawMatrix();

  /* ---------- 5. TYPEWRITER TERMINAL ---------- */
  const terminalLines = [
    { text: '$ ghostwriter run --pr 87', cls: 'prompt' },
    { text: '⏳ Cloning branch fix/null-check...', cls: 'dim' },
    { text: '🐳 Spawning Docker sandbox...', cls: 'info' },
    { text: '📦 Running npm install...', cls: 'dim' },
    { text: '🧪 Running npm test...', cls: 'info' },
    { text: '❌ FAIL: src/utils/parser.js — TypeError: Cannot read properties of null', cls: 'warn' },
    { text: '🧠 LLM analyzing failure logs...', cls: 'info' },
    { text: '🔍 Retrieving context: parser.js, config.js', cls: 'dim' },
    { text: '✏️  Applying fix: added null guard at line 42', cls: 'success' },
    { text: '🧪 Re-running npm test...', cls: 'info' },
    { text: '✅ ALL TESTS PASSED (14/14)', cls: 'success' },
    { text: '🚀 Pushing self-healing commit → fix/null-check', cls: 'success' },
    { text: '✔ Mission #87 complete — PR healed', cls: 'success' }
  ];
  const termBody = document.getElementById('terminalBody');
  const replayBtn = document.getElementById('replayBtn');
  let typewriterActive = false;

  async function typeTerminal() {
    if (typewriterActive) return;
    typewriterActive = true;
    termBody.innerHTML = '';
    for (let i = 0; i < terminalLines.length; i++) {
      const { text, cls } = terminalLines[i];
      const lineEl = document.createElement('div');
      lineEl.className = 'line ' + cls;
      termBody.appendChild(lineEl);
      lineEl.classList.add('visible');
      // type char by char
      for (let c = 0; c < text.length; c++) {
        lineEl.textContent = text.substring(0, c + 1);
        termBody.scrollTop = termBody.scrollHeight;
        await sleep(12 + Math.random() * 18);
      }
      await sleep(150 + Math.random() * 200);
    }
    // add blinking cursor at end
    const cursorSpan = document.createElement('span');
    cursorSpan.className = 'cursor-blink';
    const lastLine = termBody.lastElementChild;
    if (lastLine) lastLine.appendChild(cursorSpan);
    typewriterActive = false;
  }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  replayBtn.addEventListener('click', () => typeTerminal());

  /* ---------- 6. INTERSECTION OBSERVER — FADE UPS ---------- */
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        // stagger for siblings
        const parent = entry.target.parentElement;
        const siblings = Array.from(parent.querySelectorAll('.fade-up'));
        const i = siblings.indexOf(entry.target);
        const delay = i >= 0 ? i * 100 : 0;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

  /* ---------- 7. STATS COUNTER ANIMATION ---------- */
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCount(el, target);
        statObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-num').forEach(el => statObserver.observe(el));

  function animateCount(el, target) {
    const duration = 1500;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- 8. TECH BADGE POP-IN ---------- */
  const techObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const badges = document.querySelectorAll('.tech-badge');
        badges.forEach((b, i) => {
          setTimeout(() => b.classList.add('visible'), i * 50);
        });
        techObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  techObserver.observe(document.getElementById('techGrid'));

  /* ---------- 9. ARCHITECTURE DOT ANIMATION ---------- */
  document.querySelectorAll('.arch-dot-anim').forEach(dot => {
    const line = dot.previousElementSibling;
    if (!line) return;
    const x1 = parseFloat(line.getAttribute('x1'));
    const x2 = parseFloat(line.getAttribute('x2'));
    const y = parseFloat(line.getAttribute('y1'));
    let t = 0;
    function animDot() {
      t += 0.008;
      if (t > 1) t = 0;
      const cx = x1 + (x2 - x1) * t;
      dot.setAttribute('cx', cx);
      dot.setAttribute('cy', y);
      requestAnimationFrame(animDot);
    }
    // random start offset
    t = Math.random();
    animDot();
  });

  /* ---------- 10. HERO TITLE LETTER ANIMATION ---------- */
  function animateHeroTitle() {
    const title = document.getElementById('heroTitle');
    const html = title.innerHTML;
    // Wrap each letter (skip HTML tags) with staggered delay
    let charIndex = 0;
    const newHTML = html.replace(/(<[^>]+>)|(.)/g, (match, tag, char) => {
      if (tag) return tag;
      if (char === ' ') return ' ';
      charIndex++;
      return `<span class="anim-letter" style="animation-delay:${charIndex * 30}ms">${char}</span>`;
    });
    title.innerHTML = newHTML;
  }

  /* ---------- INIT ---------- */
  window.addEventListener('DOMContentLoaded', () => {
    animateHeroTitle();
    // delay terminal start slightly
    setTimeout(() => typeTerminal(), 800);
  });

})();
