/* ============================================================
   APP.JS — Quiz Engine · Progress Tracker · Navigation · Particles
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────
   PROGRESS MANAGER
────────────────────────────────────────── */
const Progress = (() => {
  const KEY = 'linuxfirewall_progress';

  const defaults = () => ({
    xp: 0,
    completedModules: [],
    quizScores: {},
    badges: [],
    lastVisit: null,
  });

  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || defaults();
    } catch { return defaults(); }
  };

  const save = (data) => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  };

  const get = () => load();

  const addXP = (amount) => {
    const d = load();
    d.xp += amount;
    d.lastVisit = new Date().toISOString();
    checkBadges(d);
    save(d);
    renderXP(d.xp);
    return d.xp;
  };

  const recordQuiz = (moduleId, score, total) => {
    const d = load();
    const pct = Math.round((score / total) * 100);
    d.quizScores[moduleId] = { score, total, pct, date: new Date().toISOString() };
    if (pct >= 80 && !d.completedModules.includes(moduleId)) {
      d.completedModules.push(moduleId);
      addXP(150);
    }
    checkBadges(d);
    save(d);
    return pct;
  };

  const checkBadges = (d) => {
    const earned = [];
    if (d.xp >= 100)  earned.push('spark');
    if (d.xp >= 500)  earned.push('flame');
    if (d.xp >= 1000) earned.push('rocket');
    if (d.completedModules.length >= 1) earned.push('first');
    if (d.completedModules.length >= 3) earned.push('trio');
    if (d.completedModules.length >= 7) earned.push('master');
    if (Object.values(d.quizScores).some(s => s.pct === 100)) earned.push('perfect');
    d.badges = [...new Set([...d.badges, ...earned])];
  };

  const renderXP = (xp) => {
    document.querySelectorAll('.xp-badge, .xp-number').forEach(el => {
      el.textContent = el.classList.contains('xp-badge') ? `⚡ ${xp} XP` : xp;
    });
  };

  const init = () => {
    const d = load();
    renderXP(d.xp);
    return d;
  };

  return { get, addXP, recordQuiz, init };
})();

/* ──────────────────────────────────────────
   QUIZ ENGINE
────────────────────────────────────────── */
const Quiz = (() => {
  let state = { questions: [], current: 0, score: 0, answered: false, moduleId: '' };

  const init = (questions, moduleId) => {
    state = { questions, current: 0, score: 0, answered: false, moduleId };
    render();
  };

  const render = () => {
    const box = document.querySelector('.quiz-box');
    if (!box) return;

    const q = state.questions[state.current];
    const total = state.questions.length;

    box.querySelector('.question-text').textContent = `${state.current + 1}. ${q.question}`;
    box.querySelector('.quiz-progress-fill').style.width = `${((state.current) / total) * 100}%`;
    box.querySelector('.quiz-progress-wrap .q-current').textContent = state.current + 1;
    box.querySelector('.quiz-progress-wrap .q-total').textContent = total;

    const optList = box.querySelector('.options-list');
    optList.innerHTML = '';
    const letters = ['A','B','C','D','E'];

    q.options.forEach((opt, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `<span class="opt-letter">${letters[i]}</span>${opt}`;
      btn.addEventListener('click', () => answer(i));
      li.appendChild(btn);
      optList.appendChild(li);
    });

    const exp = box.querySelector('.quiz-explanation');
    exp.style.display = 'none';
    exp.textContent = '';

    const nextBtn = box.querySelector('#quiz-next');
    if (nextBtn) nextBtn.disabled = true;

    state.answered = false;
  };

  const answer = (idx) => {
    if (state.answered) return;
    state.answered = true;

    const box = document.querySelector('.quiz-box');
    const q = state.questions[state.current];
    const buttons = box.querySelectorAll('.option-btn');

    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.correct) btn.classList.add('correct');
      else if (i === idx)  btn.classList.add('wrong');
    });

    if (idx === q.correct) {
      state.score++;
      Progress.addXP(20);
    }

    const exp = box.querySelector('.quiz-explanation');
    exp.textContent = `💡 ${q.explanation}`;
    exp.style.display = 'block';

    const nextBtn = box.querySelector('#quiz-next');
    if (nextBtn) nextBtn.disabled = false;
  };

  const next = () => {
    state.current++;
    if (state.current >= state.questions.length) {
      showResult();
    } else {
      render();
    }
  };

  const showResult = () => {
    const box = document.querySelector('.quiz-box');
    const pct = Progress.recordQuiz(state.moduleId, state.score, state.questions.length);

    box.querySelector('.quiz-question-wrap').style.display = 'none';
    const result = box.querySelector('.quiz-result');
    result.style.display = 'block';

    const circle = result.querySelector('.quiz-score-circle');
    circle.style.setProperty('--pct', `${pct}%`);
    result.querySelector('.quiz-score-text').textContent = `${pct}%`;
    result.querySelector('.quiz-result-title').textContent =
      pct === 100 ? '🏆 Perfect Score!' : pct >= 80 ? '🎉 Great Job!' : pct >= 60 ? '👍 Keep Going!' : '📚 Keep Studying!';
    result.querySelector('.quiz-result-sub').textContent =
      `You scored ${state.score} out of ${state.questions.length} questions. ${pct >= 80 ? '+150 XP earned for completing this module!' : 'Score 80%+ to earn module XP!'}`;

    if (pct >= 80) {
      const banner = document.querySelector('.completion-banner');
      if (banner) banner.classList.add('show');
    }
  };

  const restart = () => {
    state.current = 0;
    state.score = 0;
    state.answered = false;
    const box = document.querySelector('.quiz-box');
    box.querySelector('.quiz-question-wrap').style.display = 'block';
    box.querySelector('.quiz-result').style.display = 'none';
    render();
  };

  return { init, next, restart };
})();

/* ──────────────────────────────────────────
   PARTICLES
────────────────────────────────────────── */
const Particles = (() => {
  let canvas, ctx, particles = [], animId;

  const init = () => {
    canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    for (let i = 0; i < 60; i++) particles.push(newParticle());
    loop();
    window.addEventListener('resize', resize);
  };

  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  const newParticle = () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.3,
    dx: (Math.random() - 0.5) * 0.3,
    dy: (Math.random() - 0.5) * 0.3,
    alpha: Math.random() * 0.5 + 0.1,
    color: ['#00e5ff','#3d8bff','#9b59ff'][Math.floor(Math.random()*3)],
  });

  const loop = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    animId = requestAnimationFrame(loop);
  };

  return { init };
})();

/* ──────────────────────────────────────────
   NAVIGATION
────────────────────────────────────────── */
const Nav = (() => {
  const init = () => {
    // Scroll effect
    window.addEventListener('scroll', () => {
      const nav = document.querySelector('nav');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
    });

    // Active link
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
      if (link.href === window.location.href) link.classList.add('active');
    });

    // Hamburger
    const ham = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (ham && navLinks) {
      ham.addEventListener('click', () => navLinks.classList.toggle('open'));
    }

    // Sidebar toggle (lesson pages)
    const sidebarToggle = document.querySelector('#sidebar-toggle');
    const sidebar = document.querySelector('.lesson-sidebar');
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    // Sidebar active section (IntersectionObserver)
    const sections = document.querySelectorAll('[data-section]');
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    if (sections.length && sidebarLinks.length) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.section;
            sidebarLinks.forEach(a => {
              a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
            });
          }
        });
      }, { rootMargin: '-30% 0px -60% 0px' });
      sections.forEach(s => observer.observe(s));
    }
  };

  return { init };
})();

/* ──────────────────────────────────────────
   TERMINAL COPY BUTTONS
────────────────────────────────────────── */
const initCopyButtons = () => {
  document.querySelectorAll('.terminal-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const termBody = btn.closest('.terminal').querySelector('.terminal-body');
      const text = termBody.innerText
        .split('\n')
        .filter(l => l.trim() && !l.startsWith('//'))
        .map(l => l.replace(/^\$\s*/, ''))
        .join('\n');
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = '✓ copied';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('copied'); }, 2000);
      });
    });
  });
};

/* ──────────────────────────────────────────
   SCROLL ANIMATIONS
────────────────────────────────────────── */
const initScrollAnimations = () => {
  const els = document.querySelectorAll('.module-card, .cmd-card, .lab-box, .info-box, .data-table');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => { el.style.opacity = '0'; observer.observe(el); });
};

/* ──────────────────────────────────────────
   HOME PAGE — MODULE PROGRESS BARS
────────────────────────────────────────── */
const initHomeProgress = () => {
  const d = Progress.get();
  const modules = [
    { id: 'network-config', name: '🌐 Network Config' },
    { id: 'iptables',       name: '🔥 iptables/nftables' },
    { id: 'firewalld',      name: '🛡️ firewalld' },
    { id: 'ufw',            name: '🔒 UFW' },
    { id: 'monitoring',     name: '📡 Monitoring' },
    { id: 'vpn',            name: '🔑 VPN & Tunneling' },
    { id: 'hardening',      name: '⚔️ Hardening' },
  ];

  const list = document.querySelector('.progress-modules-list');
  if (list) {
    list.innerHTML = modules.map(m => {
      const qs = d.quizScores[m.id];
      const pct = qs ? qs.pct : 0;
      return `<div class="pm-item">
        <span class="pm-emoji">${m.name.split(' ')[0]}</span>
        <span class="pm-name">${m.name.slice(2)}</span>
        <div class="pm-bar"><div class="pm-fill" style="width:${pct}%"></div></div>
        <span class="pm-pct">${pct}%</span>
      </div>`;
    }).join('');
  }

  // Module cards progress bars
  document.querySelectorAll('.module-card').forEach(card => {
    const moduleId = card.dataset.module;
    if (!moduleId) return;
    const qs = d.quizScores[moduleId];
    const fill = card.querySelector('.module-progress-fill');
    if (fill) fill.style.width = qs ? `${qs.pct}%` : '0%';
  });

  // Badges
  const badgeGrid = document.querySelector('.badge-grid');
  if (badgeGrid) {
    const allBadges = [
      { id: 'spark',   emoji: '⚡', name: 'Spark' },
      { id: 'first',   emoji: '🥇', name: '1st Done' },
      { id: 'flame',   emoji: '🔥', name: 'On Fire' },
      { id: 'trio',    emoji: '🎯', name: 'Trio' },
      { id: 'rocket',  emoji: '🚀', name: 'Rocket' },
      { id: 'perfect', emoji: '💯', name: 'Perfect' },
      { id: 'master',  emoji: '🏆', name: 'Master' },
      { id: 'locked',  emoji: '🔐', name: '???' },
    ];
    badgeGrid.innerHTML = allBadges.map(b => `
      <div class="badge-item ${d.badges.includes(b.id) ? 'earned' : ''}" title="${b.name}">
        ${b.emoji}
        <span class="badge-name">${b.name}</span>
      </div>`).join('');
  }
};

/* ──────────────────────────────────────────
   QUIZ WIRING (lesson pages)
────────────────────────────────────────── */
const wireQuiz = () => {
  const box = document.querySelector('.quiz-box');
  if (!box) return;

  const nextBtn = box.querySelector('#quiz-next');
  const restartBtn = box.querySelector('#quiz-restart');

  if (nextBtn)    nextBtn.addEventListener('click', () => Quiz.next());
  if (restartBtn) restartBtn.addEventListener('click', () => Quiz.restart());

  // quizData injected by lesson page
  if (typeof quizData !== 'undefined' && typeof quizModuleId !== 'undefined') {
    Quiz.init(quizData, quizModuleId);
  }
};

/* ──────────────────────────────────────────
   TYPEWRITER EFFECT (hero)
────────────────────────────────────────── */
const initTypewriter = () => {
  const el = document.querySelector('.typewriter');
  if (!el) return;
  const words = el.dataset.words ? el.dataset.words.split('|') : [];
  if (!words.length) return;
  let wi = 0, ci = 0, deleting = false;
  const type = () => {
    const word = words[wi % words.length];
    if (!deleting) {
      el.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(type, 1800); return; }
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; wi++; }
    }
    setTimeout(type, deleting ? 60 : 100);
  };
  type();
};

/* ──────────────────────────────────────────
   MAIN INIT
────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  Progress.init();
  Nav.init();
  Particles.init();
  initCopyButtons();
  initScrollAnimations();
  initHomeProgress();
  wireQuiz();
  initTypewriter();
});
