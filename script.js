const DIFFICULTIES = {
  easy: {
    goal: 15,
    time: 40,
    badChance: 0.20,
    bonusChance: 0.10,
    speed: 3.5,
    interval: 1200,
    lives: 5
  },
  normal: {
    goal: 20,
    time: 30,
    badChance: 0.28,
    bonusChance: 0.12,
    speed: 2.8,
    interval: 900,
    lives: 3
  },
  hard: {
    goal: 30,
    time: 25,
    badChance: 0.38,
    bonusChance: 0.14,
    speed: 2.0,
    interval: 650,
    lives: 2
  }
};

const MILESTONES = [
  { pct: 0.25, msg: "25% there! Keep going!" },
  { pct: 0.50, msg: "Halfway! You're amazing!" },
  { pct: 0.75, msg: "Almost there! Don't stop!" },
  { pct: 1.00, msg: "Goal reached! Incredible!" }
];

let state = {
  running: false,
  score: 0,
  lives: 3,
  time: 30,
  diff: 'easy',
  dropTimer: null,
  countTimer: null,
  milestonesHit: new Set()
};

const arena       = document.getElementById('cw-arena');
const overlay     = document.getElementById('cw-overlay');
const scoreEl     = document.getElementById('cw-score');
const livesEl     = document.getElementById('cw-lives');
const timeEl      = document.getElementById('cw-time');
const msgEl       = document.getElementById('cw-msg');
const milestoneEl = document.getElementById('cw-milestone');

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.running) return;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.diff = btn.dataset.diff;
  });
});

document.getElementById('cw-start-btn').addEventListener('click', startGame);
document.getElementById('cw-start-btn2').addEventListener('click', startGame);

function getDiff() {
  return DIFFICULTIES[state.diff];
}

function startGame() {
  if (state.running) return;
  const d = getDiff();

  state.running = true;
  state.score = 0;
  state.lives = d.lives;
  state.time = d.time;
  state.milestonesHit = new Set();

  updateUI();
  overlay.style.display = 'none';
  document.querySelectorAll('.cw-drop').forEach(el => el.remove());

  state.dropTimer  = setInterval(spawnDrop, d.interval);
  state.countTimer = setInterval(tick, 1000);
}

function tick() {
  state.time--;
  timeEl.textContent = state.time;
  if (state.time <= 0) endGame(false);
}

function spawnDrop() {
  const d = getDiff();
  const drop = document.createElement('div');
  drop.className = 'cw-drop';

  const r = Math.random();
  let type, points;
  if (r < d.badChance) {
    type = 'bad';   points = -1;
  } else if (r < d.badChance + d.bonusChance) {
    type = 'bonus'; points = 3;
  } else {
    type = 'good';  points = 1;
  }

  drop.classList.add(type);
  drop.textContent = type === 'good' ? '💧' : type === 'bad' ? '☠️' : '🌟';

  const size = 38 + Math.random() * 22;
  drop.style.width    = size + 'px';
  drop.style.height   = size + 'px';
  drop.style.fontSize = (size * 0.55) + 'px';

  const aW = arena.offsetWidth;
  drop.style.left = Math.random() * (aW - size) + 'px';
  drop.style.animationDuration = (d.speed + Math.random() * 1.2) + 's';

  arena.appendChild(drop);

  drop.addEventListener('click', () => {
    if (!state.running) return;
    drop.remove();

    if (type === 'bad') {
      state.lives--;
      livesEl.textContent = state.lives;
      showMsg('💀 Polluted!', '#f5402c');
      if (state.lives <= 0) { endGame(false); return; }
    } else {
      state.score += points;
      scoreEl.textContent = state.score;
      showMsg(points === 3 ? '🌟 +3 Bonus!' : '+1 Drop!', '#FFC907');
      checkMilestones();
      if (state.score >= getDiff().goal) { endGame(true); return; }
    }
  });

  drop.addEventListener('animationend', () => {
    if (!drop.parentNode) return;
    drop.remove();

    if (type === 'good') {
      state.lives--;
      livesEl.textContent = state.lives;
      if (state.lives <= 0 && state.running) endGame(false);
    }
  });
}

function checkMilestones() {
  const goal = getDiff().goal;
  MILESTONES.forEach(m => {
    const key = m.pct;
    if (!state.milestonesHit.has(key) && state.score >= Math.floor(goal * m.pct)) {
      state.milestonesHit.add(key);
      showMilestone(m.msg);
    }
  });
}

function showMsg(text, color) {
  msgEl.textContent = text;
  msgEl.style.color = color;
  msgEl.style.opacity = '1';
  msgEl.style.transition = 'none';
  setTimeout(() => {
    msgEl.style.transition = 'opacity 0.6s';
    msgEl.style.opacity = '0';
  }, 500);
}

function showMilestone(text) {
  milestoneEl.textContent = text;
  milestoneEl.style.opacity = '1';
  milestoneEl.style.transition = 'none';
  setTimeout(() => {
    milestoneEl.style.transition = 'opacity 0.8s';
    milestoneEl.style.opacity = '0';
  }, 1800);
}

function endGame(won) {
  state.running = false;
  clearInterval(state.dropTimer);
  clearInterval(state.countTimer);
  document.querySelectorAll('.cw-drop').forEach(el => el.remove());

  const goal = getDiff().goal;

  overlay.innerHTML = `
    <h2 style="color:${won ? '#FFC907' : '#f5402c'}">
      ${won ? '🎉 You Win!' : '💧 Game Over'}
    </h2>
    <p style="color:#fff; font-size:15px; margin-bottom:4px;">
      Score: <strong style="color:#FFC907">${state.score}</strong> / ${goal}
    </p>
    <p style="color:#8BD1CB; font-size:13px; margin-bottom:14px;">
      ${won
        ? 'You helped bring clean water to the community!'
        : 'Keep trying — every drop counts!'}
    </p>
    <p style="color:#FFC907; font-size:12px; font-weight:700; margin-bottom:16px;">
      💛 Want to make a real difference?
      <a href="https://www.charitywater.org/donate" target="_blank"
         style="color:#FFC907;">Donate to charity: water</a>
    </p>
    <button onclick="restartGame()"
      style="padding:10px 26px; background:#FFC907; color:#1a3a5c;
             border:none; border-radius:20px; font-size:16px;
             font-weight:800; cursor:pointer;">
      ▶ Play Again
    </button>
  `;
  overlay.style.display = 'flex';
}

function restartGame() {
  overlay.innerHTML = `
    <h2>💧 Water Drop</h2>
    <p>Catch 💧 blue drops to score.<br>🌟 Golden drops = bonus points!<br>☠️ Avoid the red polluted drops.</p>
    <p style="color:#fff; font-size:12px; margin-bottom:16px;">Pick a difficulty, then start!</p>
    <button id="cw-start-btn2"
      style="padding:10px 26px; background:#FFC907; color:#1a3a5c;
             border:none; border-radius:20px; font-size:16px;
             font-weight:800; cursor:pointer;">
      ▶ Start Game
    </button>
  `;
  overlay.style.display = 'flex';
  document.getElementById('cw-start-btn2').addEventListener('click', startGame);
}

function updateUI() {
  scoreEl.textContent = state.score;
  livesEl.textContent = state.lives;
  timeEl.textContent  = state.time;
}