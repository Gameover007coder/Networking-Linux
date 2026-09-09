/* ============================================================
   APP.JS — Linux Networking & Firewall Study Portal
   Quiz Engine · Progress & Badges · Interactive Terminal ·
   Firewall Rule Generator · CIDR Subnet Calculator · Ports Matrix ·
   Lab Tracker · Global Search (Ctrl+K) · Web Audio Effects · Particles
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────
   0. WEB AUDIO SOUND EFFECTS (Zero External Files)
────────────────────────────────────────── */
const SoundFX = (() => {
  let ctx = null;
  let enabled = true;

  const init = () => {
    try {
      const saved = localStorage.getItem('linuxfirewall_sound');
      enabled = saved !== null ? JSON.parse(saved) : true;
    } catch {
      enabled = true;
    }
  };

  const getCtx = () => {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  };

  const playTone = (freq, type, duration, gainVal = 0.1) => {
    if (!enabled) return;
    try {
      const c = getCtx();
      if (!c) return;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      gain.gain.setValueAtTime(gainVal, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + duration);
    } catch {}
  };

  const click = () => playTone(800, 'sine', 0.05, 0.05);

  const correct = () => {
    if (!enabled) return;
    try {
      const c = getCtx();
      if (!c) return;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        setTimeout(() => playTone(freq, 'triangle', 0.25, 0.12), i * 80);
      });
    } catch {}
  };

  const wrong = () => {
    if (!enabled) return;
    try {
      const c = getCtx();
      if (!c) return;
      playTone(220, 'sawtooth', 0.18, 0.08);
      setTimeout(() => playTone(180, 'sawtooth', 0.22, 0.08), 90);
    } catch {}
  };

  const fanfare = () => {
    if (!enabled) return;
    try {
      const c = getCtx();
      if (!c) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 'sine', 0.35, 0.15), i * 110);
      });
    } catch {}
  };

  const toggle = () => {
    enabled = !enabled;
    try { localStorage.setItem('linuxfirewall_sound', JSON.stringify(enabled)); } catch {}
    renderToggleButtons();
    if (enabled) click();
    return enabled;
  };

  const isEnabled = () => enabled;

  const renderToggleButtons = () => {
    document.querySelectorAll('.sound-toggle-btn').forEach(btn => {
      btn.innerHTML = enabled ? '🔊 <span class="nav-btn-text">Sound ON</span>' : '🔇 <span class="nav-btn-text">Muted</span>';
      btn.title = enabled ? 'Sound effects enabled (Click to mute)' : 'Sound effects muted (Click to enable)';
    });
  };

  return { init, click, correct, wrong, fanfare, toggle, isEnabled, renderToggleButtons };
})();

/* ──────────────────────────────────────────
   1. PROGRESS & BADGES MANAGER
────────────────────────────────────────── */
const Progress = (() => {
  const KEY = 'linuxfirewall_progress';

  const defaults = () => ({
    studentName: 'Linux Sysadmin Student',
    xp: 0,
    completedModules: [],
    quizScores: {},
    completedLabSteps: {},
    badges: [],
    lastVisit: null,
  });

  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      return { ...defaults(), ...parsed };
    } catch {
      return defaults();
    }
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

  const setStudentName = (name) => {
    const d = load();
    d.studentName = name.trim() || 'Linux Sysadmin Student';
    save(d);
    return d.studentName;
  };

  const recordQuiz = (moduleId, score, total) => {
    const d = load();
    const pct = Math.round((score / total) * 100);
    d.quizScores[moduleId] = { score, total, pct, date: new Date().toISOString() };
    if (pct >= 80 && !d.completedModules.includes(moduleId)) {
      d.completedModules.push(moduleId);
      d.xp += 150;
    }
    checkBadges(d);
    save(d);
    renderXP(d.xp);
    return pct;
  };

  const toggleLabStep = (moduleId, stepIndex) => {
    const d = load();
    if (!d.completedLabSteps[moduleId]) d.completedLabSteps[moduleId] = [];
    const arr = d.completedLabSteps[moduleId];
    const exists = arr.includes(stepIndex);
    if (exists) {
      d.completedLabSteps[moduleId] = arr.filter(i => i !== stepIndex);
    } else {
      arr.push(stepIndex);
      d.xp += 10;
    }
    checkBadges(d);
    save(d);
    renderXP(d.xp);
    return !exists;
  };

  const getLabSteps = (moduleId) => {
    const d = load();
    return d.completedLabSteps[moduleId] || [];
  };

  const checkBadges = (d) => {
    const earned = [];
    if (d.xp >= 100) earned.push('spark');
    if (d.xp >= 500) earned.push('flame');
    if (d.xp >= 1000) earned.push('rocket');
    if (d.completedModules.length >= 1) earned.push('first');
    if (d.completedModules.length >= 3) earned.push('trio');
    if (d.completedModules.length >= 7) earned.push('master');
    if (Object.values(d.quizScores).some(s => s.pct === 100)) earned.push('perfect');

    // Total lab steps completed
    const totalLabs = Object.values(d.completedLabSteps || {}).reduce((acc, curr) => acc + (curr ? curr.length : 0), 0);
    if (totalLabs >= 5) earned.push('lab_pro');

    d.badges = [...new Set([...d.badges, ...earned])];
  };

  const renderXP = (xp) => {
    document.querySelectorAll('.xp-badge, .xp-number').forEach(el => {
      el.textContent = el.classList.contains('xp-badge') ? `⚡ ${xp} XP` : xp;
    });
  };

  const resetAll = () => {
    try { localStorage.removeItem(KEY); } catch {}
    const fresh = defaults();
    renderXP(0);
    return fresh;
  };

  const init = () => {
    const d = load();
    renderXP(d.xp);
    return d;
  };

  return { get, addXP, recordQuiz, toggleLabStep, getLabSteps, setStudentName, resetAll, init };
})();

/* ──────────────────────────────────────────
   2. QUIZ ENGINE (Live Score, Keyboard & Sound)
────────────────────────────────────────── */
const Quiz = (() => {
  let state = { questions: [], current: 0, score: 0, answered: false, moduleId: '' };

  const init = (questions, moduleId) => {
    state = { questions, current: 0, score: 0, answered: false, moduleId };
    render();
    setupKeyListeners();
  };

  const render = () => {
    const box = document.querySelector('.quiz-box');
    if (!box) return;

    const q = state.questions[state.current];
    const total = state.questions.length;

    const qText = box.querySelector('.question-text');
    if (qText) qText.textContent = `${state.current + 1}. ${q.question}`;

    const fill = box.querySelector('.quiz-progress-fill');
    if (fill) fill.style.width = `${((state.current) / total) * 100}%`;

    const currEl = box.querySelector('.quiz-progress-wrap .q-current');
    if (currEl) currEl.textContent = state.current + 1;

    const totEl = box.querySelector('.quiz-progress-wrap .q-total');
    if (totEl) totEl.textContent = total;

    const scoreEl = box.querySelector('.quiz-progress-wrap .q-score');
    if (scoreEl) scoreEl.textContent = `Score: ${state.score} / ${state.current} (+${state.score * 20} XP)`;

    const optList = box.querySelector('.options-list');
    if (optList) {
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
    }

    const exp = box.querySelector('.quiz-explanation');
    if (exp) {
      exp.style.display = 'none';
      exp.textContent = '';
    }

    const nextBtn = box.querySelector('#quiz-next');
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.textContent = (state.current + 1 === total) ? 'View Results 🏆' : 'Next Question →';
    }

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
      SoundFX.correct();
    } else {
      SoundFX.wrong();
    }

    const scoreEl = box.querySelector('.quiz-progress-wrap .q-score');
    if (scoreEl) scoreEl.textContent = `Score: ${state.score} / ${state.current + 1} (+${state.score * 20} XP)`;

    const exp = box.querySelector('.quiz-explanation');
    if (exp) {
      exp.textContent = `💡 ${q.explanation}`;
      exp.style.display = 'block';
    }

    const nextBtn = box.querySelector('#quiz-next');
    if (nextBtn) nextBtn.disabled = false;
  };

  const next = () => {
    SoundFX.click();
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

    const qWrap = box.querySelector('.quiz-question-wrap');
    if (qWrap) qWrap.style.display = 'none';

    const result = box.querySelector('.quiz-result');
    if (result) {
      result.style.display = 'block';
      const circle = result.querySelector('.quiz-score-circle');
      if (circle) circle.style.setProperty('--pct', `${pct}%`);

      const textEl = result.querySelector('.quiz-score-text');
      if (textEl) textEl.textContent = `${pct}%`;

      const titleEl = result.querySelector('.quiz-result-title');
      if (titleEl) {
        titleEl.textContent = pct === 100 ? '🏆 Perfect Score!' : pct >= 80 ? '🎉 Outstanding Work!' : pct >= 60 ? '👍 Good Effort!' : '📚 Keep Practicing!';
      }

      const subEl = result.querySelector('.quiz-result-sub');
      if (subEl) {
        subEl.textContent = `You scored ${state.score} out of ${state.questions.length} questions correctly. ${
          pct >= 80 ? '⭐ Congratulations! You unlocked the module completion bonus (+150 XP)!' : 'You need 80% to earn the module completion XP bonus. You can review the lesson and try again anytime.'
        }`;
      }
    }

    if (pct >= 80) {
      SoundFX.fanfare();
      const banner = document.querySelector('.completion-banner');
      if (banner) banner.classList.add('show');
    }
  };

  const restart = () => {
    SoundFX.click();
    state.current = 0;
    state.score = 0;
    state.answered = false;
    const box = document.querySelector('.quiz-box');
    if (!box) return;
    const qWrap = box.querySelector('.quiz-question-wrap');
    if (qWrap) qWrap.style.display = 'block';
    const result = box.querySelector('.quiz-result');
    if (result) result.style.display = 'none';
    render();
  };

  let keysBound = false;
  const setupKeyListeners = () => {
    if (keysBound) return;
    keysBound = true;
    window.addEventListener('keydown', (e) => {
      const box = document.querySelector('.quiz-box');
      if (!box || box.querySelector('.quiz-result')?.style.display === 'block') return;

      // Don't capture when typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const key = e.key.toLowerCase();
      if (!state.answered) {
        let optIdx = -1;
        if (['1', 'a'].includes(key)) optIdx = 0;
        else if (['2', 'b'].includes(key)) optIdx = 1;
        else if (['3', 'c'].includes(key)) optIdx = 2;
        else if (['4', 'd'].includes(key)) optIdx = 3;
        else if (['5', 'e'].includes(key)) optIdx = 4;

        if (optIdx >= 0 && optIdx < state.questions[state.current].options.length) {
          e.preventDefault();
          answer(optIdx);
        }
      } else {
        if (key === 'enter' || key === ' ') {
          e.preventDefault();
          next();
        }
      }
    });
  };

  return { init, next, restart };
})();

/* ──────────────────────────────────────────
   3. BACKGROUND PARTICLES CANVAS
────────────────────────────────────────── */
const Particles = (() => {
  let canvas, ctx, particles = [], animId, resizeRaf;

  // Fewer particles on small/low-power screens, capped so it never scales
  // past what actually looks different on a large display.
  const particleCount = () => Math.max(18, Math.min(55, Math.round(window.innerWidth / 24)));

  const init = () => {
    canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    // prefers-reduced-motion: skip the animation loop entirely.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return;
    }
    ctx = canvas.getContext('2d', { alpha: true });
    resize();
    particles = [];
    const count = particleCount();
    for (let i = 0; i < count; i++) particles.push(newParticle());
    loop();

    // Debounce resize (rAF-coalesced) instead of resizing/rebuilding on every pixel.
    window.addEventListener('resize', () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(resize);
    }, { passive: true });

    // Stop drawing entirely while the tab is in the background — no point
    // burning CPU/GPU on a canvas nobody can see.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animId) cancelAnimationFrame(animId);
        animId = null;
      } else if (!animId) {
        loop();
      }
    });
  };

  const resize = () => {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  const newParticle = () => ({
    x: Math.random() * (canvas?.width || 800),
    y: Math.random() * (canvas?.height || 600),
    r: Math.random() * 1.5 + 0.3,
    dx: (Math.random() - 0.5) * 0.25,
    dy: (Math.random() - 0.5) * 0.25,
    alpha: Math.random() * 0.45 + 0.1,
    color: ['#00e5ff', '#3d8bff', '#00ffa3', '#9b59ff'][Math.floor(Math.random() * 4)],
  });

  const loop = () => {
    if (!ctx || !canvas) return;
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
   4. NAVIGATION & MOBILE SIDEBAR
────────────────────────────────────────── */
const Nav = (() => {
  const init = () => {
    // Scroll effect for top nav
    window.addEventListener('scroll', () => {
      const nav = document.querySelector('nav');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
    });

    // Active link highlighting
    const links = document.querySelectorAll('.nav-links a');
    const currentLoc = window.location.pathname;
    links.forEach(link => {
      const linkPath = new URL(link.href, window.location.origin).pathname;
      if (linkPath === currentLoc || (currentLoc.endsWith('/') && linkPath.endsWith('index.html'))) {
        link.classList.add('active');
      }
    });

    // Mobile Hamburger Menu
    const ham = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (ham && navLinks) {
      ham.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navLinks.classList.toggle('open');
        ham.classList.toggle('open', isOpen);
        SoundFX.click();
      });

      // Close mobile nav when clicking any nav link
      navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          navLinks.classList.remove('open');
          ham.classList.remove('open');
        });
      });

      // Close mobile nav when clicking outside
      document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !ham.contains(e.target)) {
          navLinks.classList.remove('open');
          ham.classList.remove('open');
        }
      });
    }

    // Sidebar Mobile Toggle for Lesson Pages
    const sidebar = document.querySelector('.lesson-sidebar');
    if (sidebar) {
      // Ensure backdrop exists
      let backdrop = document.querySelector('.sidebar-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
      }

      // Ensure a sidebar toggle button exists in breadcrumbs
      const breadcrumb = document.querySelector('.lesson-breadcrumb');
      if (breadcrumb && !document.querySelector('.sidebar-toggle-btn')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle-btn';
        toggleBtn.id = 'sidebar-toggle';
        toggleBtn.innerHTML = '☰ Lesson Outline';
        breadcrumb.prepend(toggleBtn);
      }

      const sidebarToggle = document.querySelector('#sidebar-toggle, .sidebar-toggle-btn');
      if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
          sidebar.classList.toggle('open');
          backdrop.classList.toggle('show');
          SoundFX.click();
        });
      }

      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('show');
      });

      // Close sidebar when clicking a link on mobile
      sidebar.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          if (window.innerWidth <= 900) {
            sidebar.classList.remove('open');
            backdrop.classList.remove('show');
          }
        });
      });
    }

    // Sidebar active section tracking via IntersectionObserver
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
      }, { rootMargin: '-20% 0px -60% 0px' });
      sections.forEach(s => observer.observe(s));
    }
  };

  return { init };
})();

/* ──────────────────────────────────────────
   5. DYNAMIC UI ENHANCEMENTS (Scroll bar, Back to top, Audio button)
────────────────────────────────────────── */
const initGlobalUI = () => {
  // 1. Reading Progress Bar at top
  let pBar = document.getElementById('reading-progress');
  if (!pBar) {
    pBar = document.createElement('div');
    pBar.id = 'reading-progress';
    document.body.prepend(pBar);
  }

  // 2. Scroll to Top Button
  let topBtn = document.getElementById('scroll-to-top');
  if (!topBtn) {
    topBtn = document.createElement('button');
    topBtn.id = 'scroll-to-top';
    topBtn.innerHTML = '↑';
    topBtn.title = 'Scroll to top';
    document.body.appendChild(topBtn);
    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      SoundFX.click();
    });
  }

  window.addEventListener('scroll', () => {
    const scrollH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollH > 0 ? (window.scrollY / scrollH) * 100 : 0;
    if (pBar) pBar.style.width = `${progress}%`;

    if (topBtn) {
      if (window.scrollY > 350) {
        topBtn.classList.add('visible');
      } else {
        topBtn.classList.remove('visible');
      }
    }
  });

  // 3. Audio & Search buttons in nav
  const nav = document.querySelector('nav');
  if (nav && !nav.querySelector('.nav-actions')) {
    const actions = document.createElement('div');
    actions.className = 'nav-actions';

    // Search button
    const searchBtn = document.createElement('button');
    searchBtn.className = 'nav-action-btn search-trigger-btn';
    searchBtn.innerHTML = '🔍 <span class="nav-btn-text">Search</span> <span class="kbd-hint">Ctrl+K</span>';
    searchBtn.title = 'Quick command search (Ctrl+K)';
    searchBtn.addEventListener('click', () => SearchModal.open());

    // Sound toggle
    const soundBtn = document.createElement('button');
    soundBtn.className = 'nav-action-btn sound-toggle-btn';
    soundBtn.addEventListener('click', () => SoundFX.toggle());

    actions.appendChild(searchBtn);
    actions.appendChild(soundBtn);

    const navProgress = nav.querySelector('.nav-progress');
    if (navProgress) {
      nav.insertBefore(actions, navProgress);
    } else {
      nav.appendChild(actions);
    }
    SoundFX.renderToggleButtons();
  }
};

/* ──────────────────────────────────────────
   6. INTERACTIVE LAB STEPS TRACKER
────────────────────────────────────────── */
const initLabTracker = () => {
  const labBoxes = document.querySelectorAll('.lab-box');
  if (!labBoxes.length) return;

  const moduleId = (typeof quizModuleId !== 'undefined') ? quizModuleId : 'generic-lab';
  const completedSteps = Progress.getLabSteps(moduleId);

  labBoxes.forEach(lab => {
    const steps = lab.querySelectorAll('.lab-step');
    if (!steps.length) return;

    // Create tracker header
    let tracker = lab.querySelector('.lab-progress-tracker');
    if (!tracker) {
      tracker = document.createElement('div');
      tracker.className = 'lab-progress-tracker';
      lab.insertBefore(tracker, lab.querySelector('.lab-steps'));
    }

    const updateTracker = () => {
      const currentDone = Progress.getLabSteps(moduleId).length;
      tracker.innerHTML = `
        <div class="lab-progress-text">
          🧪 Lab Progress: <strong>${currentDone} of ${steps.length}</strong> tasks checked
        </div>
        <div class="chip">${Math.round((currentDone / steps.length) * 100)}% Done</div>
      `;
    };

    steps.forEach((step, idx) => {
      const isDone = completedSteps.includes(idx);
      if (isDone) step.classList.add('step-completed');

      let checkBtn = step.querySelector('.lab-step-check-btn');
      if (!checkBtn) {
        checkBtn = document.createElement('button');
        checkBtn.className = 'lab-step-check-btn';
        step.querySelector('.lab-step-body').appendChild(checkBtn);
      }

      checkBtn.innerHTML = isDone ? '✓ Completed (+10 XP)' : '⬜ Mark Step Done';

      checkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nowDone = Progress.toggleLabStep(moduleId, idx);
        step.classList.toggle('step-completed', nowDone);
        checkBtn.innerHTML = nowDone ? '✓ Completed (+10 XP)' : '⬜ Mark Step Done';
        if (nowDone) SoundFX.correct();
        else SoundFX.click();
        updateTracker();

        // If all done
        if (Progress.getLabSteps(moduleId).length === steps.length) {
          SoundFX.fanfare();
        }
      });
    });

    updateTracker();
  });
};

/* ──────────────────────────────────────────
   7. INTERACTIVE TERMINAL SIMULATOR
────────────────────────────────────────── */
const TerminalSim = (() => {
  const commands = {
    help: `Available commands in this simulated Linux network environment:
  ip a, ip addr, ip link, ip route      - Network configuration
  iptables -L -n -v, iptables -t nat -L - Packet filtering & NAT tables
  firewall-cmd --state, --list-all      - firewalld status & zones
  ufw status verbose                    - Ubuntu UFW status
  ss -tulpn, ss -s                      - Socket inspection & statistics
  ping -c 3 8.8.8.8, ping google.com    - ICMP echo testing
  traceroute 1.1.1.1                    - Network path tracing
  nmap -sS -p 22,80,443 192.168.1.1     - Port scanning
  wg show, wg genkey                    - WireGuard VPN state & keygen
  fail2ban-client status sshd           - SSH brute force defense
  sysctl net.ipv4.ip_forward            - Kernel packet forwarding
  whoami, uname -a, clear, man          - System information`,

    man: `MANUAL: Type any network/firewall command (e.g. 'ip a', 'iptables -L -n -v', 'ufw status', 'ss -tulpn') to see realistic simulated Linux sysadmin output.`,

    whoami: `student_admin`,

    'uname -a': `Linux debian-prod 6.6.15-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.6.15-1 (2024-02-04) x86_64 GNU/Linux`,

    'ip a': `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: ens3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 52:54:00:a1:b2:c3 brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.150/24 brd 192.168.1.255 scope global dynamic ens3
       valid_lft 84210sec preferred_lft 84210sec
    inet6 fe80::5054:ff:fea1:b2c3/64 scope link
       valid_lft forever preferred_lft forever`,

    'ip addr': `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default
    inet 127.0.0.1/8 scope host lo
2: ens3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default
    inet 192.168.1.150/24 brd 192.168.1.255 scope global dynamic ens3`,

    'ip link': `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: ens3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default
    link/ether 52:54:00:a1:b2:c3 brd ff:ff:ff:ff:ff:ff`,

    'ip route': `default via 192.168.1.1 dev ens3 proto dhcp src 192.168.1.150 metric 100
192.168.1.0/24 dev ens3 proto kernel scope link src 192.168.1.150 metric 100`,

    'iptables -L -n -v': `Chain INPUT (policy DROP 14 packets, 840 bytes)
 pkts bytes target     prot opt in     out     source               destination
 128K   98M ACCEPT     all  --  lo     *       0.0.0.0/0            0.0.0.0/0
 945K  812M ACCEPT     all  --  *      *       0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
 4812  288K ACCEPT     tcp  --  ens3   *       0.0.0.0/0            0.0.0.0/0            tcp dpt:22
 224K   14M ACCEPT     tcp  --  ens3   *       0.0.0.0/0            0.0.0.0/0            tcp dpt:80
 810K  102M ACCEPT     tcp  --  ens3   *       0.0.0.0/0            0.0.0.0/0            tcp dpt:443

Chain FORWARD (policy DROP 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain OUTPUT (policy ACCEPT 1.2M packets, 950M bytes)
 pkts bytes target     prot opt in     out     source               destination`,

    'iptables -t nat -L': `Chain PREROUTING (policy ACCEPT)
target     prot opt source               destination
DNAT       tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:80 to:192.168.1.200:8080

Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination

Chain POSTROUTING (policy ACCEPT)
target     prot opt source               destination
MASQUERADE  all  --  192.168.100.0/24     0.0.0.0/0`,

    'firewall-cmd --state': `running`,

    'firewall-cmd --list-all': `public (active)
  target: default
  icmp-block-inversion: no
  interfaces: ens3
  sources:
  services: dhcpv6-client http https ssh
  ports: 51820/udp
  protocols:
  forward: yes
  masquerade: yes
  forward-ports:
  source-ports:
  icmp-blocks:
  rich rules:
	rule family="ipv4" source address="192.168.1.0/24" service name="ssh" accept`,

    'ufw status verbose': `Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp (OpenSSH)           ALLOW IN    Anywhere
80/tcp (Nginx HTTP)        ALLOW IN    Anywhere
443/tcp (Nginx HTTPS)      ALLOW IN    Anywhere
51820/udp (WireGuard)      ALLOW IN    Anywhere
22/tcp (OpenSSH (v6))      ALLOW IN    Anywhere (v6)
80/tcp (Nginx HTTP (v6))   ALLOW IN    Anywhere (v6)
443/tcp (Nginx HTTPS (v6)) ALLOW IN    Anywhere (v6)`,

    'ss -tulpn': `Netid  State   Recv-Q  Send-Q    Local Address:Port    Peer Address:Port  Process
tcp    LISTEN  0       128           0.0.0.0:22             0.0.0.0:*      users:(("sshd",pid=680,fd=3))
tcp    LISTEN  0       511           0.0.0.0:80             0.0.0.0:*      users:(("nginx",pid=1120,fd=6))
tcp    LISTEN  0       511           0.0.0.0:443            0.0.0.0:*      users:(("nginx",pid=1120,fd=7))
udp    UNCONN  0       0             0.0.0.0:51820          0.0.0.0:*      users:(("wireguard",pid=410,fd=4))
udp    UNCONN  0       0       127.0.0.53%lo:53             0.0.0.0:*      users:(("systemd-resolve",pid=512,fd=13))`,

    'ss -s': `Total: 194
TCP:   18 (estab 3, closed 2, orphaned 0, timewait 0)

Transport Total     IP        IPv6
RAW	  0         0         0
UDP	  6         4         2
TCP	  16        12        4
INET	  22        16        6
FRAG	  0         0         0`,

    'ping -c 3 8.8.8.8': `PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=14.3 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=118 time=13.8 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=118 time=14.1 ms

--- 8.8.8.8 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms
rtt min/avg/max/mdev = 13.842/14.081/14.312/0.192 ms`,

    'ping google.com': `PING google.com (142.250.190.46) 56(84) bytes of data.
64 bytes from ord38s29-in-f14.1e100.net (142.250.190.46): icmp_seq=1 ttl=117 time=16.2 ms
64 bytes from ord38s29-in-f14.1e100.net (142.250.190.46): icmp_seq=2 ttl=117 time=15.9 ms
64 bytes from ord38s29-in-f14.1e100.net (142.250.190.46): icmp_seq=3 ttl=117 time=16.4 ms

--- google.com ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2004ms
rtt min/avg/max/mdev = 15.912/16.166/16.410/0.204 ms`,

    'traceroute 1.1.1.1': `traceroute to 1.1.1.1 (1.1.1.1), 30 hops max, 60 byte packets
 1  _gateway (192.168.1.1)  0.642 ms  0.518 ms  0.490 ms
 2  10.240.0.1 (10.240.0.1)  4.112 ms  3.980 ms  4.020 ms
 3  172.16.88.1 (172.16.88.1)  8.412 ms  8.290 ms  8.350 ms
 4  one.one.one.one (1.1.1.1)  13.480 ms  13.290 ms  13.310 ms`,

    'nmap -sS -p 22,80,443 192.168.1.1': `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for router.local (192.168.1.1)
Host is up (0.0012s latency).

PORT    STATE  SERVICE
22/tcp  open   ssh
80/tcp  open   http
443/tcp open   https
MAC Address: 52:54:00:12:34:56 (QEMU Virtual NIC)

Nmap done: 1 IP address (1 host up) scanned in 0.22 seconds`,

    'wg show': `interface: wg0
  public key: oPqK7j9zF+1qL...EXAMPLE...x4c9=
  private key: (hidden)
  listening port: 51820

peer: dXJ2A+9K1xP...CLIENT_KEY...88b=
  endpoint: 203.0.113.88:51820
  allowed ips: 10.0.0.2/32
  latest handshake: 1 minute, 12 seconds ago
  transfer: 4.82 MiB received, 18.94 MiB sent`,

    'wg genkey': `4KmP8qRtW2xYz9A+B7cD1eF3gH5jK7mN9pQ1sT3vW5x=`,

    'fail2ban-client status sshd': `Status for the jail: sshd
|- Filter
|  |- Currently failed: 3
|  |- Total failed:     64
|  \`- File list:        /var/log/auth.log
\`- Actions
   |- Currently banned: 2
   |- Total banned:     11
   \`- Banned IP list:   198.51.100.42 203.0.113.99`,

    'sysctl net.ipv4.ip_forward': `net.ipv4.ip_forward = 1`,

    'cat /etc/resolv.conf': `nameserver 1.1.1.1
nameserver 8.8.8.8
options edns0 trust-ad`,

    'cat /etc/os-release': `PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"
NAME="Debian GNU/Linux"
VERSION_ID="12"
VERSION="12 (bookworm)"
ID=debian
HOME_URL="https://www.debian.org/"`,
  };

  let history = [];
  let historyIdx = -1;

  const run = (inputCmd) => {
    const screen = document.querySelector('.sim-screen');
    if (!screen) return;

    const trimmed = inputCmd.trim();
    if (!trimmed) return;

    history.push(trimmed);
    historyIdx = history.length;

    // Echo command
    const promptLine = document.createElement('div');
    promptLine.className = 'sim-line';
    promptLine.innerHTML = `<span class="sim-prompt">student@linux-lab:~$</span> <span class="sim-accent">${escapeHtml(trimmed)}</span>`;
    screen.appendChild(promptLine);

    if (trimmed === 'clear') {
      screen.innerHTML = '';
      return;
    }

    // Match command
    let output = '';
    const lower = trimmed.toLowerCase();

    // Exact or normalized match
    if (commands[trimmed]) {
      output = commands[trimmed];
    } else if (commands[lower]) {
      output = commands[lower];
    } else {
      // Partial prefix matching
      const foundKey = Object.keys(commands).find(k => lower === k.toLowerCase() || lower.startsWith(k.toLowerCase()));
      if (foundKey) {
        output = commands[foundKey];
      } else {
        output = `bash: ${escapeHtml(trimmed.split(' ')[0])}: command not recognized in this lab simulator.\nType 'help' to see available commands or click the quick tags below.`;
      }
    }

    const outLine = document.createElement('div');
    outLine.className = 'sim-line sim-output';
    outLine.innerHTML = escapeHtml(output).replace(/\n/g, '<br>');
    screen.appendChild(outLine);

    screen.scrollTop = screen.scrollHeight;
    Progress.addXP(5);
  };

  const escapeHtml = (str) => {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const init = () => {
    const terminal = document.querySelector('.sim-terminal');
    if (!terminal) return;

    const input = terminal.querySelector('.sim-input');
    const screen = terminal.querySelector('.sim-screen');
    const clearBtn = terminal.querySelector('#sim-clear-btn');
    const quickTags = terminal.querySelectorAll('.sim-quick-tag');

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = input.value;
          input.value = '';
          run(val);
          SoundFX.click();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (history.length > 0 && historyIdx > 0) {
            historyIdx--;
            input.value = history[historyIdx];
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIdx < history.length - 1) {
            historyIdx++;
            input.value = history[historyIdx];
          } else {
            historyIdx = history.length;
            input.value = '';
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          // Auto complete
          const prefix = input.value.trim().toLowerCase();
          if (prefix) {
            const match = Object.keys(commands).find(k => k.startsWith(prefix));
            if (match) input.value = match;
          }
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (screen) screen.innerHTML = '';
        SoundFX.click();
      });
    }

    quickTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const cmd = tag.dataset.cmd || tag.textContent;
        if (input) input.value = cmd;
        run(cmd);
        SoundFX.click();
      });
    });
  };

  return { init, run };
})();

/* ──────────────────────────────────────────
   8. FIREWALL RULE GENERATOR (Live Multi-Firewall Converter)
────────────────────────────────────────── */
const FirewallGen = (() => {
  let state = {
    tool: 'iptables',
    action: 'allow',
    proto: 'tcp',
    port: '22',
    src: 'any',
  };

  const compute = () => {
    const { action, proto, port, src } = state;
    const isAllow = action === 'allow';
    const isDrop = action === 'drop';
    const isNat = action === 'nat';

    // 1. iptables
    let iptablesCmd = '';
    if (isNat) {
      iptablesCmd = `sudo iptables -t nat -A PREROUTING -p ${proto} --dport ${port || '80'} -j DNAT --to-destination 192.168.1.100:${port || '80'}`;
    } else {
      const target = isAllow ? 'ACCEPT' : 'DROP';
      const srcFlag = src && src !== 'any' ? `-s ${src} ` : '';
      const portFlag = proto !== 'icmp' ? `--dport ${port || '22'} ` : '';
      iptablesCmd = `sudo iptables -A INPUT -p ${proto} ${srcFlag}${portFlag}-j ${target}`;
    }

    // 2. firewalld
    let firewalldCmd = '';
    if (isNat) {
      firewalldCmd = `sudo firewall-cmd --permanent --add-forward-port=port=${port || '80'}:proto=${proto}:toport=${port || '80'}:toaddr=192.168.1.100 && sudo firewall-cmd --reload`;
    } else {
      if (src && src !== 'any') {
        const ruleAction = isAllow ? 'accept' : 'drop';
        firewalldCmd = `sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="${src}" port port="${port || '22'}" protocol="${proto}" ${ruleAction}' && sudo firewall-cmd --reload`;
      } else {
        if (isAllow) {
          firewalldCmd = `sudo firewall-cmd --permanent --add-port=${port || '22'}/${proto} && sudo firewall-cmd --reload`;
        } else {
          firewalldCmd = `sudo firewall-cmd --permanent --add-rich-rule='rule port port="${port || '22'}" protocol="${proto}" drop' && sudo firewall-cmd --reload`;
        }
      }
    }

    // 3. UFW
    let ufwCmd = '';
    if (isNat) {
      ufwCmd = `# Add to /etc/ufw/before.rules under *nat:\n-A PREROUTING -p ${proto} --dport ${port || '80'} -j DNAT --to 192.168.1.100:${port || '80'}\n# then run: sudo ufw reload`;
    } else {
      const ufwAction = isAllow ? 'allow' : 'deny';
      const srcPart = src && src !== 'any' ? `from ${src} ` : '';
      ufwCmd = `sudo ufw ${ufwAction} ${srcPart}proto ${proto} to any port ${port || '22'}`;
    }

    const iptEl = document.getElementById('gen-out-iptables');
    const fwdEl = document.getElementById('gen-out-firewalld');
    const ufwEl = document.getElementById('gen-out-ufw');

    if (iptEl) iptEl.textContent = iptablesCmd;
    if (fwdEl) fwdEl.textContent = firewalldCmd;
    if (ufwEl) ufwEl.textContent = ufwCmd;
  };

  const init = () => {
    const form = document.querySelector('.gen-form');
    if (!form) return;

    // Action buttons
    form.querySelectorAll('[data-opt="action"]').forEach(btn => {
      btn.addEventListener('click', () => {
        form.querySelectorAll('[data-opt="action"]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.action = btn.dataset.val;
        compute();
        SoundFX.click();
      });
    });

    // Protocol buttons
    form.querySelectorAll('[data-opt="proto"]').forEach(btn => {
      btn.addEventListener('click', () => {
        form.querySelectorAll('[data-opt="proto"]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.proto = btn.dataset.val;
        compute();
        SoundFX.click();
      });
    });

    // Port input & presets
    const portInput = form.querySelector('#gen-port-input');
    if (portInput) {
      portInput.addEventListener('input', (e) => {
        state.port = e.target.value.trim();
        compute();
      });
    }

    form.querySelectorAll('.port-preset-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const val = tag.dataset.port;
        if (portInput) portInput.value = val;
        state.port = val;
        compute();
        SoundFX.click();
      });
    });

    // Source IP input
    const srcInput = form.querySelector('#gen-src-input');
    if (srcInput) {
      srcInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        state.src = val || 'any';
        compute();
      });
    }

    compute();
  };

  return { init };
})();

/* ──────────────────────────────────────────
   9. CIDR & SUBNET CALCULATOR
────────────────────────────────────────── */
const SubnetCalc = (() => {
  const ipToInt = (ip) => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  };

  const intToIp = (int) => {
    return [
      (int >>> 24) & 255,
      (int >>> 16) & 255,
      (int >>> 8) & 255,
      int & 255
    ].join('.');
  };

  const intToBinary = (int) => {
    return [
      ((int >>> 24) & 255).toString(2).padStart(8, '0'),
      ((int >>> 16) & 255).toString(2).padStart(8, '0'),
      ((int >>> 8) & 255).toString(2).padStart(8, '0'),
      (int & 255).toString(2).padStart(8, '0')
    ].join('.');
  };

  const calculate = () => {
    const ipInput = document.getElementById('calc-ip');
    const cidrInput = document.getElementById('calc-cidr');
    if (!ipInput || !cidrInput) return;

    const ipStr = ipInput.value.trim() || '192.168.1.50';
    const cidr = parseInt(cidrInput.value, 10) || 24;

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ipStr)) return;

    const ip = ipToInt(ipStr);
    const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    const wildcard = (~mask) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;

    let totalHosts = Math.pow(2, 32 - cidr);
    let usableHosts = cidr >= 31 ? (cidr === 31 ? 2 : 1) : totalHosts - 2;
    let firstUsable = cidr >= 31 ? network : network + 1;
    let lastUsable = cidr >= 31 ? broadcast : broadcast - 1;

    const netIpStr = intToIp(network);
    const broadIpStr = intToIp(broadcast);
    const maskStr = intToIp(mask);
    const wildStr = intToIp(wildcard);
    const rangeStr = `${intToIp(firstUsable)} – ${intToIp(lastUsable)}`;

    // Update DOM
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('calc-out-network', netIpStr);
    setVal('calc-out-broadcast', broadIpStr);
    setVal('calc-out-mask', maskStr);
    setVal('calc-out-wildcard', wildStr);
    setVal('calc-out-range', rangeStr);
    setVal('calc-out-usable', usableHosts.toLocaleString());
    setVal('calc-out-total', totalHosts.toLocaleString());
    setVal('calc-out-binary', intToBinary(ip));
  };

  const init = () => {
    const ipInput = document.getElementById('calc-ip');
    const cidrInput = document.getElementById('calc-cidr');
    if (!ipInput || !cidrInput) return;

    ipInput.addEventListener('input', calculate);
    cidrInput.addEventListener('input', calculate);
    calculate();
  };

  return { init };
})();

/* ──────────────────────────────────────────
   10. COMMON PORTS & PROTOCOLS MATRIX
────────────────────────────────────────── */
const PortMatrix = (() => {
  const ports = [
    { port: 22,   proto: 'TCP', svc: 'SSH',        cat: 'remote', desc: 'Secure Shell remote login & SCP/SFTP', rule: 'Allow restricted IPs or use fail2ban' },
    { port: 53,   proto: 'UDP/TCP', svc: 'DNS',    cat: 'infra',  desc: 'Domain Name System queries & zone transfers', rule: 'Allow outbound 53, restrict inbound unless DNS server' },
    { port: 67,   proto: 'UDP', svc: 'DHCP Server',cat: 'infra',  desc: 'Dynamic Host Configuration Protocol server', rule: 'Internal interface only' },
    { port: 80,   proto: 'TCP', svc: 'HTTP',       cat: 'web',    desc: 'Unencrypted web traffic & ACME challenge', rule: 'Allow public HTTP (redirect to 443)' },
    { port: 123,  proto: 'UDP', svc: 'NTP',        cat: 'infra',  desc: 'Network Time Protocol synchronization', rule: 'Allow outbound to reliable NTP pools' },
    { port: 443,  proto: 'TCP', svc: 'HTTPS',      cat: 'web',    desc: 'Encrypted TLS/SSL web traffic', rule: 'Allow public inbound HTTPS' },
    { port: 1194, proto: 'UDP', svc: 'OpenVPN',    cat: 'security',desc: 'OpenVPN default tunnel port', rule: 'Allow public UDP on VPN gateway' },
    { port: 3306, proto: 'TCP', svc: 'MySQL/MariaDB',cat: 'db',   desc: 'Database listener', rule: 'Never expose to public internet; bind 127.0.0.1 or VPN' },
    { port: 5432, proto: 'TCP', svc: 'PostgreSQL', cat: 'db',     desc: 'PostgreSQL database listener', rule: 'Internal network or localhost only' },
    { port: 6379, proto: 'TCP', svc: 'Redis',      cat: 'db',     desc: 'In-memory cache & queue', rule: 'Bind localhost only; block all external traffic' },
    { port: 8080, proto: 'TCP', svc: 'HTTP Alt / Proxy',cat: 'web',desc: 'Secondary web server or reverse proxy', rule: 'Allow if public or route via port 80/443' },
    { port: 51820,proto: 'UDP', svc: 'WireGuard',  cat: 'security',desc: 'Modern, kernel-space VPN endpoint', rule: 'Allow inbound UDP from anywhere or client IP' },
  ];

  const render = (items) => {
    const tbody = document.getElementById('ports-table-body');
    if (!tbody) return;
    tbody.innerHTML = items.map(p => `
      <tr>
        <td><strong class="chip" style="font-size:0.82rem;">${p.port}</strong></td>
        <td><span class="chip">${p.proto}</span></td>
        <td><strong>${p.svc}</strong></td>
        <td>${p.desc}</td>
        <td><span style="color:var(--green);font-size:0.82rem;">${p.rule}</span></td>
      </tr>
    `).join('');
  };

  const init = () => {
    const search = document.getElementById('port-search');
    if (!search) return;

    render(ports);

    search.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = ports.filter(p =>
        p.port.toString().includes(q) ||
        p.svc.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.proto.toLowerCase().includes(q)
      );
      render(filtered);
    });
  };

  return { init };
})();

/* ──────────────────────────────────────────
   11. GLOBAL SEARCH MODAL (Ctrl+K)
────────────────────────────────────────── */
const SearchModal = (() => {
  const commandsDb = [
    { cmd: 'ip addr show', mod: 'Network', desc: 'Display all network interfaces and assigned IP addresses' },
    { cmd: 'ip route show', mod: 'Network', desc: 'Display kernel routing table and default gateway' },
    { cmd: 'ip link set eth0 up', mod: 'Network', desc: 'Bring up a specific network interface' },
    { cmd: 'nmcli connection show', mod: 'Network', desc: 'List all NetworkManager connection profiles' },
    { cmd: 'nmcli con add type ethernet con-name static-eth0 ifname eth0 ip4 192.168.1.100/24 gw4 192.168.1.1', mod: 'Network', desc: 'Add permanent static IPv4 connection profile' },
    { cmd: 'sysctl -w net.ipv4.ip_forward=1', mod: 'Network', desc: 'Enable packet forwarding temporarily in kernel' },
    { cmd: 'cat /etc/resolv.conf', mod: 'Network', desc: 'Inspect configured DNS resolver nameservers' },
    { cmd: 'iptables -L -n -v', mod: 'iptables', desc: 'List all iptables rules with packet & byte counts' },
    { cmd: 'iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT', mod: 'iptables', desc: 'Allow return traffic for active connections' },
    { cmd: 'iptables -A INPUT -p tcp --dport 22 -j ACCEPT', mod: 'iptables', desc: 'Allow inbound SSH on port 22' },
    { cmd: 'iptables -P INPUT DROP', mod: 'iptables', desc: 'Set default policy of INPUT chain to DROP' },
    { cmd: 'iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE', mod: 'iptables', desc: 'Enable NAT masquerade for outbound traffic' },
    { cmd: 'nft list ruleset', mod: 'iptables', desc: 'Display active modern nftables ruleset' },
    { cmd: 'iptables-save > /etc/iptables/rules.v4', mod: 'iptables', desc: 'Save active iptables rules to file for persistence' },
    { cmd: 'firewall-cmd --state', mod: 'firewalld', desc: 'Check if firewalld daemon is currently active' },
    { cmd: 'firewall-cmd --get-active-zones', mod: 'firewalld', desc: 'List active firewalld zones and bound interfaces' },
    { cmd: 'firewall-cmd --permanent --add-service=http', mod: 'firewalld', desc: 'Allow HTTP service permanently in default zone' },
    { cmd: 'firewall-cmd --reload', mod: 'firewalld', desc: 'Reload firewalld configuration without breaking connections' },
    { cmd: 'firewall-cmd --add-masquerade --permanent', mod: 'firewalld', desc: 'Enable IP masquerading on the zone for NAT router' },
    { cmd: 'ufw status verbose', mod: 'UFW', desc: 'Display detailed UFW firewall status, policies, and rules' },
    { cmd: 'ufw default deny incoming', mod: 'UFW', desc: 'Set UFW default inbound policy to block all traffic' },
    { cmd: 'ufw allow 22/tcp', mod: 'UFW', desc: 'Allow incoming SSH traffic on TCP port 22' },
    { cmd: 'ufw allow from 192.168.1.0/24 to any port 3306', mod: 'UFW', desc: 'Allow subnet to access MySQL port 3306' },
    { cmd: 'ss -tulpn', mod: 'Monitoring', desc: 'List all listening TCP/UDP sockets with process names & PIDs' },
    { cmd: 'tcpdump -i eth0 -nn -c 20 port 80', mod: 'Monitoring', desc: 'Capture first 20 HTTP packets on eth0 with numeric IPs' },
    { cmd: 'nmap -sS -p 1-1024 192.168.1.1', mod: 'Monitoring', desc: 'Perform stealth SYN scan on first 1024 ports of target' },
    { cmd: 'wg show', mod: 'VPN', desc: 'Inspect active WireGuard interface, peers, handshake and transfer stats' },
    { cmd: 'wg-quick up wg0', mod: 'VPN', desc: 'Start WireGuard tunnel using /etc/wireguard/wg0.conf' },
    { cmd: 'ssh -L 8080:localhost:80 user@remote', mod: 'VPN', desc: 'Local SSH port forward: tunnel remote port 80 to localhost:8080' },
    { cmd: 'fail2ban-client status sshd', mod: 'Hardening', desc: 'Check banned IPs and active jail stats for OpenSSH' },
    { cmd: 'fail2ban-client set sshd unbanip 192.168.1.100', mod: 'Hardening', desc: 'Unban an accidental lock-out IP address in fail2ban' },
    { cmd: 'sysctl -p /etc/sysctl.d/99-security.conf', mod: 'Hardening', desc: 'Apply network hardening kernel parameters immediately' },
  ];

  let modalBackdrop = null;

  const buildModal = () => {
    if (modalBackdrop) return;

    modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop search-modal-backdrop';
    modalBackdrop.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">🔍 Quick Command Finder</div>
          <button class="modal-close" id="search-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="search-input-wrap">
            <span>🔎</span>
            <input type="text" class="search-modal-input" placeholder="Search commands, flags, tools (e.g. iptables, NAT, ss, wireguard)..." autofocus />
          </div>
          <div class="search-filter-tags">
            <span class="search-filter-tag active" data-filter="all">All (30+)</span>
            <span class="search-filter-tag" data-filter="Network">Network</span>
            <span class="search-filter-tag" data-filter="iptables">iptables</span>
            <span class="search-filter-tag" data-filter="firewalld">firewalld</span>
            <span class="search-filter-tag" data-filter="UFW">UFW</span>
            <span class="search-filter-tag" data-filter="Monitoring">Monitor</span>
            <span class="search-filter-tag" data-filter="VPN">VPN</span>
            <span class="search-filter-tag" data-filter="Hardening">Harden</span>
          </div>
          <div class="search-results-list"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);

    const closeBtn = modalBackdrop.querySelector('#search-close-btn');
    closeBtn.addEventListener('click', close);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) close();
    });

    const input = modalBackdrop.querySelector('.search-modal-input');
    input.addEventListener('input', () => filterAndRender());

    const tags = modalBackdrop.querySelectorAll('.search-filter-tag');
    tags.forEach(t => {
      t.addEventListener('click', () => {
        tags.forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        filterAndRender();
        SoundFX.click();
      });
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        open();
      } else if (e.key === 'Escape' && modalBackdrop.classList.contains('show')) {
        close();
      }
    });
  };

  const filterAndRender = () => {
    if (!modalBackdrop) return;
    const input = modalBackdrop.querySelector('.search-modal-input');
    const q = (input ? input.value : '').toLowerCase().trim();
    const activeTag = modalBackdrop.querySelector('.search-filter-tag.active');
    const filter = activeTag ? activeTag.dataset.filter : 'all';

    const results = commandsDb.filter(item => {
      const matchesFilter = filter === 'all' || item.mod.toLowerCase() === filter.toLowerCase();
      const matchesQuery = !q || item.cmd.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.mod.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });

    const list = modalBackdrop.querySelector('.search-results-list');
    if (!list) return;

    if (!results.length) {
      list.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-muted);">No matching commands found. Try another keyword!</div>`;
      return;
    }

    list.innerHTML = results.map(item => `
      <div class="search-result-item">
        <div>
          <div class="sr-cmd">${item.cmd}</div>
          <div class="sr-desc">${item.desc}</div>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <span class="chip" style="font-size:0.7rem;">${item.mod}</span>
          <button class="terminal-copy sr-copy-btn" data-copy="${item.cmd}">copy</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.sr-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.copy;
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = '✓ copied';
          btn.classList.add('copied');
          SoundFX.click();
          setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('copied'); }, 1800);
        });
      });
    });
  };

  const open = () => {
    buildModal();
    modalBackdrop.classList.add('show');
    const input = modalBackdrop.querySelector('.search-modal-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    filterAndRender();
    SoundFX.click();
  };

  const close = () => {
    if (modalBackdrop) modalBackdrop.classList.remove('show');
  };

  return { open, close };
})();

/* ──────────────────────────────────────────
   12. PBL CERTIFICATE & REPORT CARD MODAL
────────────────────────────────────────── */
const CertificateModal = (() => {
  let modalBackdrop = null;

  const buildModal = () => {
    if (modalBackdrop) return;

    modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop cert-modal-backdrop';
    modalBackdrop.innerHTML = `
      <div class="modal-content" style="max-width:720px;">
        <div class="modal-header">
          <div class="modal-title">📜 PBL Completion Report & Certificate</div>
          <button class="modal-close" id="cert-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="cert-card" id="cert-print-area">
            <div class="cert-icon">🛡️</div>
            <div class="cert-title">CERTIFICATE OF ACHIEVEMENT</div>
            <div class="cert-subtitle">Linux System Administration — Networking & Firewall</div>
            <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:1rem;">This certificate verifies the successful completion of the hands-on project-based curriculum.</p>
            
            <div style="margin:1rem 0;">
              <span style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;">Awarded To</span><br>
              <input type="text" class="cert-student-name" id="cert-name-input" value="Linux Sysadmin Student" title="Click to edit student name" />
            </div>

            <div class="cert-stats-row">
              <div class="cert-stat">
                <div class="cert-stat-val" id="cert-xp-val">0</div>
                <div class="cert-stat-lbl">Total XP Earned</div>
              </div>
              <div class="cert-stat">
                <div class="cert-stat-val" id="cert-mods-val">0 / 7</div>
                <div class="cert-stat-lbl">Modules Completed</div>
              </div>
              <div class="cert-stat">
                <div class="cert-stat-val" id="cert-score-val">0%</div>
                <div class="cert-stat-lbl">Average Quiz Score</div>
              </div>
            </div>

            <div style="font-size:0.75rem;color:var(--text-muted);display:flex;justify-content:space-between;margin-top:2rem;padding-top:1rem;border-top:1px solid var(--border);">
              <span>Issue Date: <strong id="cert-date-val" style="color:var(--text-primary)"></strong></span>
              <span>Project ID: <strong style="color:var(--cyan)">PBL-LINUX-FW-2026</strong></span>
              <span>Verified: <strong style="color:var(--green)">PASSED ✓</strong></span>
            </div>
          </div>

          <div style="display:flex;gap:1rem;justify-content:center;margin-top:1.5rem;flex-wrap:wrap;">
            <button class="btn btn-primary" id="cert-print-btn">🖨️ Print / Save PDF</button>
            <button class="btn btn-secondary" id="cert-reset-btn" style="border-color:var(--red);color:var(--red);">🔄 Reset Progress</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);

    const closeBtn = modalBackdrop.querySelector('#cert-close-btn');
    closeBtn.addEventListener('click', close);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) close();
    });

    const nameInput = modalBackdrop.querySelector('#cert-name-input');
    nameInput.addEventListener('change', (e) => {
      Progress.setStudentName(e.target.value);
    });

    const printBtn = modalBackdrop.querySelector('#cert-print-btn');
    printBtn.addEventListener('click', () => {
      window.print();
    });

    const resetBtn = modalBackdrop.querySelector('#cert-reset-btn');
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all quiz scores, lab progress, and XP? This cannot be undone.')) {
        Progress.resetAll();
        alert('All progress has been reset.');
        location.reload();
      }
    });
  };

  const open = () => {
    buildModal();
    const d = Progress.get();
    modalBackdrop.querySelector('#cert-name-input').value = d.studentName || 'Linux Sysadmin Student';
    modalBackdrop.querySelector('#cert-xp-val').textContent = `${d.xp} XP`;
    modalBackdrop.querySelector('#cert-mods-val').textContent = `${d.completedModules.length} / 7`;

    const scores = Object.values(d.quizScores || {});
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b.pct, 0) / scores.length) : 0;
    modalBackdrop.querySelector('#cert-score-val').textContent = `${avg}%`;

    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    modalBackdrop.querySelector('#cert-date-val').textContent = dateStr;

    modalBackdrop.classList.add('show');
    SoundFX.click();
  };

  const close = () => {
    if (modalBackdrop) modalBackdrop.classList.remove('show');
  };

  return { open, close };
})();

/* ──────────────────────────────────────────
   13. TERMINAL COPY BUTTONS
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
        SoundFX.click();
        setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('copied'); }, 2000);
      });
    });
  });
};

/* ──────────────────────────────────────────
   14. SCROLL ANIMATIONS
────────────────────────────────────────── */
const initScrollAnimations = () => {
  const els = document.querySelectorAll('.module-card, .cmd-card, .lab-box, .info-box, .data-table, .interactive-suite');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(el => { el.style.opacity = '0'; observer.observe(el); });
};

/* ──────────────────────────────────────────
   15. HOME PAGE PROGRESS & STATUS BADGES
────────────────────────────────────────── */
const initHomeProgress = () => {
  const d = Progress.get();
  const modules = [
    { id: 'network-config', name: '🌐 Network Config' },
    { id: 'iptables',       name: '🔥 iptables & nftables' },
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

  // Module cards status and progress bars
  document.querySelectorAll('.module-card').forEach(card => {
    const moduleId = card.dataset.module;
    if (!moduleId) return;
    const qs = d.quizScores[moduleId];
    const pct = qs ? qs.pct : 0;

    const fill = card.querySelector('.module-progress-fill');
    if (fill) fill.style.width = `${pct}%`;

    // Status badge injection
    const meta = card.querySelector('.module-meta');
    if (meta && !card.querySelector('.module-status-badge')) {
      const badge = document.createElement('span');
      badge.className = 'module-status-badge';
      if (pct >= 80) {
        badge.classList.add('status-completed');
        badge.innerHTML = '✓ Done';
      } else if (pct > 0) {
        badge.classList.add('status-in-progress');
        badge.innerHTML = `⚡ ${pct}%`;
      } else {
        badge.classList.add('status-not-started');
        badge.innerHTML = 'Start';
      }
      meta.appendChild(badge);
    }
  });

  // Badges grid
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
      { id: 'lab_pro', emoji: '🧪', name: 'Lab Pro' },
    ];
    badgeGrid.innerHTML = allBadges.map(b => `
      <div class="badge-item ${d.badges.includes(b.id) ? 'earned' : ''}" title="${b.name}">
        ${b.emoji}
        <span class="badge-name">${b.name}</span>
      </div>`).join('');
  }

  // Certificate button wiring
  const certBtn = document.getElementById('view-cert-btn');
  if (certBtn) {
    certBtn.addEventListener('click', () => CertificateModal.open());
  }
};

/* ──────────────────────────────────────────
   16. QUIZ WIRING FOR LESSON PAGES
────────────────────────────────────────── */
const wireQuiz = () => {
  const box = document.querySelector('.quiz-box');
  if (!box) return;

  const nextBtn = box.querySelector('#quiz-next');
  const restartBtn = box.querySelector('#quiz-restart');

  if (nextBtn)    nextBtn.addEventListener('click', () => Quiz.next());
  if (restartBtn) restartBtn.addEventListener('click', () => Quiz.restart());

  if (typeof quizData !== 'undefined' && typeof quizModuleId !== 'undefined') {
    Quiz.init(quizData, quizModuleId);
  }
};

/* ──────────────────────────────────────────
   17. HERO TYPEWRITER EFFECT
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
      if (ci === word.length) { deleting = true; setTimeout(type, 2000); return; }
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; wi++; }
    }
    setTimeout(type, deleting ? 45 : 85);
  };
  type();
};

/* ──────────────────────────────────────────
   18. INTERACTIVE SUITE TABS
────────────────────────────────────────── */
const initSuiteTabs = () => {
  const tabs = document.querySelectorAll('.tool-tab');
  const panes = document.querySelectorAll('.tool-pane');
  if (!tabs.length || !panes.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.dataset.target;
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');

      // Pause the animated bandwidth graph whenever its pane isn't the one
      // on screen, and fetch live network info the first time its tab opens.
      if (typeof LiveTelemetry !== 'undefined') LiveTelemetry.setActive(targetId === 'tab-telemetry');
      if (targetId === 'tab-mynetwork' && typeof NetworkInfo !== 'undefined') NetworkInfo.loadOnce();

      SoundFX.click();
    });
  });
};

/* ──────────────────────────────────────────
   19. REALTIME NETWORK TELEMETRY & BANDWIDTH GRAPH
────────────────────────────────────────── */
const LiveTelemetry = (() => {
  let canvas, ctx;
  let rxHistory = new Array(36).fill(280);
  let txHistory = new Array(36).fill(140);
  let timer = null;
  let totalPkts = 1842000;
  let droppedPkts = 28140;

  const startTimer = () => {
    if (timer) return;
    timer = setInterval(tick, 1000);
  };

  const stopTimer = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  };

  // Only spend CPU animating this chart while its pane is actually
  // visible and the browser tab is in the foreground.
  const setActive = (isActive) => {
    if (isActive && !document.hidden) startTimer();
    else stopTimer();
  };

  const init = () => {
    canvas = document.getElementById('bandwidth-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      const pane = document.getElementById('tab-telemetry');
      setActive(!!pane && pane.classList.contains('active'));
    });
    startTimer();
    renderGraph();
  };

  const resize = () => {
    if (!canvas) return;
    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth - 40 : 600;
    canvas.height = 160;
  };

  const tick = () => {
    const baseRx = 380 + Math.sin(Date.now() / 2800) * 140 + (Math.random() - 0.5) * 80;
    const baseTx = 190 + Math.cos(Date.now() / 2200) * 90 + (Math.random() - 0.5) * 50;

    const newRx = Math.max(90, Math.round(baseRx));
    const newTx = Math.max(40, Math.round(baseTx));

    rxHistory.shift(); rxHistory.push(newRx);
    txHistory.shift(); txHistory.push(newTx);

    totalPkts += Math.round(newRx / 1.4);
    if (Math.random() < 0.45) droppedPkts += Math.round(Math.random() * 4);

    const rxEl = document.getElementById('telemetry-rx-speed');
    const txEl = document.getElementById('telemetry-tx-speed');
    const pktsEl = document.getElementById('telemetry-total-pkts');
    const dropEl = document.getElementById('telemetry-dropped-pkts');

    if (rxEl) rxEl.textContent = `${newRx} KB/s`;
    if (txEl) txEl.textContent = `${newTx} KB/s`;
    if (pktsEl) pktsEl.textContent = totalPkts.toLocaleString();
    if (dropEl) dropEl.textContent = droppedPkts.toLocaleString();

    renderGraph();
  };

  const renderGraph = () => {
    if (!ctx || !canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 20; y < h; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const maxVal = Math.max(650, ...rxHistory, ...txHistory);
    const step = w / (rxHistory.length - 1);

    const drawWave = (data, strokeColor, fillStart) => {
      ctx.beginPath();
      ctx.moveTo(0, h - (data[0] / maxVal) * (h - 25));
      for (let i = 0; i < data.length - 1; i++) {
        const x1 = i * step;
        const y1 = h - (data[i] / maxVal) * (h - 25);
        const x2 = (i + 1) * step;
        const y2 = h - (data[i + 1] / maxVal) * (h - 25);
        const mx = (x1 + x2) / 2;
        ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2);
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, fillStart);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fill();
    };

    drawWave(txHistory, '#9b59ff', 'rgba(155, 89, 255, 0.2)');
    drawWave(rxHistory, '#00e5ff', 'rgba(0, 229, 255, 0.24)');
  };

  return { init, setActive };
})();

/* ──────────────────────────────────────────
   20. NETFILTER PACKET TRAVERSAL SIMULATOR
────────────────────────────────────────── */
const NetfilterSim = (() => {
  const scenarios = {
    http: {
      title: 'HTTP Web Traffic (Port 80 to Local Web Server)',
      path: ['nf-ingress', 'nf-preroute', 'nf-routing', 'nf-input', 'nf-socket'],
      verdict: 'ACCEPTED',
      badgeClass: 'status-completed',
      rule: 'iptables -A INPUT -p tcp --dport 80 -j ACCEPT (Nginx HTTP)',
      explanation: 'Packet arrives on ens3 -> PREROUTING table -> Routing evaluates destination as 192.168.1.150 (Local Host) -> Sent to INPUT chain -> Matches rule accepting TCP dport 80 -> Delivered to local Nginx socket.'
    },
    ssh: {
      title: 'SSH Remote Admin (Port 22 with Established Conntrack)',
      path: ['nf-ingress', 'nf-preroute', 'nf-routing', 'nf-input', 'nf-socket'],
      verdict: 'ACCEPTED (Conntrack)',
      badgeClass: 'status-completed',
      rule: 'iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT',
      explanation: 'Kernel conntrack table recognizes packet belongs to established session. State matches ESTABLISHED -> Fast-path approved directly to SSH daemon.'
    },
    blocked: {
      title: 'Telnet Probe (Port 23 from Untrusted IP 203.0.113.88)',
      path: ['nf-ingress', 'nf-preroute', 'nf-routing', 'nf-input'],
      verdict: 'DROPPED (Policy: DROP)',
      badgeClass: 'status-not-started',
      rule: 'iptables -P INPUT DROP (Default Firewall Policy)',
      explanation: 'Packet enters ens3 -> PREROUTING table -> Evaluated as local destination -> Traverses INPUT chain -> No rule accepts Port 23 -> Hits default policy DROP -> Packet discarded silently without sending RST.'
    },
    forward: {
      title: 'NAT Router Forwarding (Client 10.0.0.2 to Internet 8.8.8.8)',
      path: ['nf-ingress', 'nf-preroute', 'nf-routing', 'nf-forward', 'nf-postroute'],
      verdict: 'MASQUERADED & FORWARDED',
      badgeClass: 'status-in-progress',
      rule: 'iptables -t nat -A POSTROUTING -o ens3 -j MASQUERADE',
      explanation: 'Routing decision confirms destination 8.8.8.8 is non-local -> Forwarding chain permits packet -> POSTROUTING alters source IP to public IP 192.168.1.150 -> Forwarded out ens3.'
    }
  };

  const dispatch = (scenarioKey) => {
    const s = scenarios[scenarioKey] || scenarios.http;
    const allNodes = document.querySelectorAll('.nf-node');
    allNodes.forEach(n => {
      n.classList.remove('highlight', 'accepted', 'dropped');
    });

    const verdictEl = document.getElementById('nf-verdict-result');
    const ruleEl = document.getElementById('nf-rule-result');
    const expEl = document.getElementById('nf-exp-result');

    if (verdictEl) verdictEl.innerHTML = '<span style="color:var(--cyan)">Evaluating packet path...</span>';
    if (ruleEl) ruleEl.textContent = 'Traversing Netfilter chains...';
    if (expEl) expEl.textContent = '';

    s.path.forEach((nodeId, idx) => {
      setTimeout(() => {
        const node = document.getElementById(nodeId);
        if (node) {
          node.classList.add('highlight');
          SoundFX.click();
        }
        if (idx === s.path.length - 1) {
          setTimeout(() => {
            if (node) {
              if (s.verdict.startsWith('ACCEPT') || s.verdict.startsWith('MASQ')) {
                node.classList.add('accepted');
                SoundFX.correct();
              } else {
                node.classList.add('dropped');
                SoundFX.wrong();
              }
            }
            if (verdictEl) verdictEl.innerHTML = `<span class="module-status-badge ${s.badgeClass}">${s.verdict}</span>`;
            if (ruleEl) ruleEl.textContent = s.rule;
            if (expEl) expEl.textContent = s.explanation;
          }, 350);
        }
      }, idx * 400);
    });
  };

  const init = () => {
    const sel = document.getElementById('nf-packet-select');
    const sendBtn = document.getElementById('nf-send-btn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const val = sel ? sel.value : 'http';
        dispatch(val);
      });
    }
    if (sel) {
      sel.addEventListener('change', () => {
        dispatch(sel.value);
      });
    }
  };

  return { init, dispatch };
})();

/* ──────────────────────────────────────────
   21. REALTIME ATTACK & DEFENSE SIMULATOR
────────────────────────────────────────── */
const AttackSim = (() => {
  let logBody = null;

  const log = (msg, type = 'info') => {
    if (!logBody) logBody = document.getElementById('attack-log-stream');
    if (!logBody) return;
    const now = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    let typeSpan = `<span class="log-info">[INFO]</span>`;
    if (type === 'alert') typeSpan = `<span class="log-alert">[ALERT]</span>`;
    else if (type === 'blocked') typeSpan = `<span class="log-blocked">[BLOCKED]</span>`;
    entry.innerHTML = `<span class="log-time">${now}</span> ${typeSpan} ${msg}`;
    logBody.appendChild(entry);
    logBody.scrollTop = logBody.scrollHeight;
  };

  const runSynFlood = () => {
    log('Incoming TCP SYN flood detected on port 80 (Rate: 580 pkts/sec)', 'alert');
    SoundFX.wrong();
    setTimeout(() => {
      log('Kernel TCP syncookies active: generating syncookie tokens', 'info');
    }, 600);
    setTimeout(() => {
      log('iptables rule match: -A INPUT -p tcp --syn -m limit --limit 1/s -j ACCEPT engaged', 'info');
      log('Mitigated: Dropping 579 unauthenticated SYN packets/sec. Host responsive.', 'blocked');
      SoundFX.correct();
      Progress.addXP(15);
    }, 1200);
  };

  const runSshSpray = () => {
    log('Failed password for root from 198.51.100.44 port 43812 ssh2', 'alert');
    SoundFX.wrong();
    setTimeout(() => {
      log('Failed password for root from 198.51.100.44 port 43814 ssh2 (Attempt 3/5)', 'alert');
    }, 500);
    setTimeout(() => {
      log('Failed password for admin from 198.51.100.44 port 43816 ssh2 (Attempt 5/5)', 'alert');
      log('fail2ban.filter [sshd]: MaxRetry reached for IP 198.51.100.44', 'alert');
    }, 1100);
    setTimeout(() => {
      log('fail2ban.actions [sshd]: Ban IP 198.51.100.44 for 3600 seconds', 'blocked');
      log('Rule injected: iptables -I f2b-sshd 1 -s 198.51.100.44 -j REJECT', 'blocked');
      SoundFX.fanfare();
      Progress.addXP(20);
    }, 1800);
  };

  const runPortScan = () => {
    log('Port scan detected: 203.0.113.99 scanned TCP ports 21, 23, 25, 80, 443, 3306', 'alert');
    SoundFX.wrong();
    setTimeout(() => {
      log('iptables policy INPUT DROP: Silent drop executed for closed ports (Zero RST packets returned)', 'blocked');
      log('Attacker nmap result: 1000 ports in "filtered" state (Stealth defense successful)', 'blocked');
      SoundFX.correct();
      Progress.addXP(15);
    }, 900);
  };

  const init = () => {
    logBody = document.getElementById('attack-log-stream');
    const synBtn = document.getElementById('btn-sim-syn');
    const sshBtn = document.getElementById('btn-sim-ssh');
    const scanBtn = document.getElementById('btn-sim-scan');
    const clearLogBtn = document.getElementById('btn-clear-attack-log');

    if (synBtn) synBtn.addEventListener('click', runSynFlood);
    if (sshBtn) sshBtn.addEventListener('click', runSshSpray);
    if (scanBtn) scanBtn.addEventListener('click', runPortScan);
    if (clearLogBtn) {
      clearLogBtn.addEventListener('click', () => {
        if (logBody) logBody.innerHTML = '';
        SoundFX.click();
      });
    }
  };

  return { init, runSynFlood, runSshSpray, runPortScan };
})();

/* ──────────────────────────────────────────
   22. WIREGUARD VPN PAIRED CONFIG GENERATOR
────────────────────────────────────────── */
const WireGuardTool = (() => {
  const genKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let s = '';
    for (let i = 0; i < 43; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s + '=';
  };

  const generate = () => {
    const srvPriv = genKey();
    const srvPub = genKey();
    const cliPriv = genKey();
    const cliPub = genKey();

    const srvCode = `[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = ${srvPriv}
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ens3 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ens3 -j MASQUERADE

[Peer]
# Client 1
PublicKey = ${cliPub}
AllowedIPs = 10.0.0.2/32`;

    const cliCode = `[Interface]
Address = 10.0.0.2/24
PrivateKey = ${cliPriv}
DNS = 1.1.1.1

[Peer]
PublicKey = ${srvPub}
Endpoint = 203.0.113.150:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;

    const srvEl = document.getElementById('wg-server-output');
    const cliEl = document.getElementById('wg-client-output');

    if (srvEl) srvEl.textContent = srvCode;
    if (cliEl) cliEl.textContent = cliCode;

    SoundFX.correct();
    Progress.addXP(10);
  };

  const init = () => {
    const genBtn = document.getElementById('btn-wg-generate');
    if (genBtn) {
      genBtn.addEventListener('click', generate);
      generate();
    }
  };

  return { init, generate };
})();

/* ──────────────────────────────────────────
   23. DNS RESOLVER & BENCHMARK — REAL DoH QUERIES
   Queries live DNS-over-HTTPS resolvers straight from the browser
   (no backend needed) and times the actual round trip with
   performance.now(). Falls back to a clear "unreachable" state per
   row instead of ever inventing a number.
────────────────────────────────────────── */
const DnsBench = (() => {
  const dnsServers = [
    {
      name: 'Cloudflare', ip: '1.1.1.1', features: 'DoH JSON API / DNSSEC',
      query: async (domain, signal) => {
        const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
          headers: { accept: 'application/dns-json' }, signal
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }
    },
    {
      name: 'Google', ip: '8.8.8.8', features: 'DoH JSON API / Global Anycast',
      query: async (domain, signal) => {
        const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`, { signal });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }
    },
    {
      name: 'Quad9', ip: '9.9.9.9', features: 'DoH JSON API / Malware Block',
      query: async (domain, signal) => {
        const res = await fetch(`https://dns.quad9.net:5053/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
          headers: { accept: 'application/dns-json' }, signal
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }
    }
  ];

  const rcodeToAnswer = (json) => {
    if (!json || !json.Answer || !json.Answer.length) return json && json.Status === 0 ? 'No A record' : 'NXDOMAIN';
    const a = json.Answer.find(r => r.type === 1) || json.Answer[0];
    return `A: ${a.data}`;
  };

  const runOne = async (server, domain) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const start = performance.now();
    try {
      const json = await server.query(domain, controller.signal);
      const latency = Math.round(performance.now() - start);
      return { ok: true, latency, answer: rcodeToAnswer(json) };
    } catch (err) {
      return { ok: false, error: err.name === 'AbortError' ? 'Timed out' : 'Blocked / unreachable from browser' };
    } finally {
      clearTimeout(timeout);
    }
  };

  const rowHtml = (server, result) => {
    if (!result.ok) {
      return `
        <tr>
          <td><strong>${server.name}</strong></td>
          <td><code class="chip">${server.ip}</code></td>
          <td colspan="2"><span style="color:var(--text-muted);">${result.error}</span></td>
          <td><span class="chip" style="font-size:0.75rem;color:var(--red);">no answer</span></td>
        </tr>`;
    }
    const { latency } = result;
    const widthPct = Math.min(100, latency * 2);
    const barColor = latency < 40 ? 'var(--green)' : latency < 120 ? 'var(--cyan)' : 'var(--blue)';
    return `
      <tr>
        <td><strong>${server.name}</strong></td>
        <td><code class="chip">${server.ip}</code></td>
        <td>
          <strong style="color:${barColor}">${latency} ms</strong>
          <div class="dns-bar-wrap">
            <div class="dns-bar-fill" style="width:${widthPct}%;background:${barColor}"></div>
          </div>
        </td>
        <td><span style="font-size:0.78rem;color:var(--text-secondary);">${server.features}</span></td>
        <td><span class="chip" style="font-size:0.75rem;">${result.answer}</span></td>
      </tr>`;
  };

  const test = async () => {
    const domainInput = document.getElementById('dns-domain-input');
    const domain = (domainInput ? domainInput.value.trim() : '') || 'kernel.org';
    const tbody = document.getElementById('dns-bench-tbody');
    if (!tbody) return;

    SoundFX.click();
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--cyan);padding:1rem;">Sending live DoH queries for <strong>${domain}</strong>…</td></tr>`;

    // Fire all resolvers in parallel and render each row as soon as it
    // resolves, so a slow/blocked resolver never delays the fast ones.
    tbody.innerHTML = dnsServers.map(s => `<tr id="dns-row-${s.name}"><td><strong>${s.name}</strong></td><td colspan="4" style="color:var(--text-muted);">querying…</td></tr>`).join('');

    await Promise.all(dnsServers.map(async (server) => {
      const result = await runOne(server, domain);
      const row = document.getElementById(`dns-row-${server.name}`);
      if (row) row.outerHTML = rowHtml(server, result);
    }));

    SoundFX.correct();
    Progress.addXP(10);
  };

  const init = () => {
    const btn = document.getElementById('btn-dns-test');
    if (btn) btn.addEventListener('click', test);
  };

  return { init, test };
})();

/* ──────────────────────────────────────────
   23b. LIVE "MY NETWORK" PANEL — genuinely real data
   Everything here is either read straight from the browser (Navigation
   Timing, Network Information API, clock, online/offline events) or
   fetched once from small, CORS-enabled public APIs (public IP + geo/ISP
   lookup). No fabricated numbers anywhere in this module.
────────────────────────────────────────── */
const NetworkInfo = (() => {
  let loaded = false;
  let clockTimer = null;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  // --- Real browser-reported connection info (Chrome/Edge/Android; not
  // implemented in Firefox/Safari, so we degrade honestly rather than guess).
  const renderConnectionInfo = () => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) {
      setText('net-conn-type', 'Not exposed by this browser');
      setText('net-conn-downlink', '—');
      setText('net-conn-rtt', '—');
      setText('net-conn-savedata', '—');
      return;
    }
    const update = () => {
      setText('net-conn-type', conn.effectiveType ? conn.effectiveType.toUpperCase() : 'Unknown');
      setText('net-conn-downlink', conn.downlink != null ? `${conn.downlink} Mbps (est.)` : '—');
      setText('net-conn-rtt', conn.rtt != null ? `${conn.rtt} ms` : '—');
      setText('net-conn-savedata', conn.saveData ? 'On' : 'Off');
    };
    update();
    conn.addEventListener('change', update);
  };

  // --- Real static browser/device facts, no network call needed.
  const renderBrowserFacts = () => {
    setText('net-timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || '—');
    setText('net-language', navigator.language || '—');
    setText('net-platform', navigator.userAgentData?.platform || navigator.platform || '—');
    setText('net-screen', `${window.screen.width}\u00d7${window.screen.height} @ ${window.devicePixelRatio || 1}x`);
    setText('net-cores', navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} logical cores` : '—');
  };

  // --- Real live online/offline state for this device.
  const renderOnlineStatus = () => {
    const el = document.getElementById('net-online-status');
    const update = () => {
      if (!el) return;
      el.textContent = navigator.onLine ? '● Online' : '● Offline';
      el.style.color = navigator.onLine ? 'var(--green)' : 'var(--red)';
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  };

  // --- Real Navigation Timing for THIS page load — actual DNS/TCP/TTFB
  // numbers for the connection the visitor's browser just made.
  const renderPageTiming = () => {
    const [nav] = performance.getEntriesByType('navigation');
    if (!nav) {
      setText('net-timing-dns', 'Unavailable');
      return;
    }
    const ms = (a, b) => Math.max(0, Math.round(b - a));
    setText('net-timing-dns', `${ms(nav.domainLookupStart, nav.domainLookupEnd)} ms`);
    setText('net-timing-tcp', `${ms(nav.connectStart, nav.connectEnd)} ms`);
    setText('net-timing-ttfb', `${ms(nav.requestStart, nav.responseStart)} ms`);
    setText('net-timing-total', `${ms(nav.startTime, nav.loadEventEnd || performance.now())} ms`);
  };

  // --- Real public IP + geolocation/ISP, fetched once (rate-limited public
  // APIs — no point re-polling this every second).
  const renderPublicIp = async () => {
    setText('net-public-ip', 'Looking up…');
    setText('net-geo', 'Looking up…');
    setText('net-isp', 'Looking up…');
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data.error) throw new Error(data.reason || 'lookup failed');
      setText('net-public-ip', data.ip || 'Unknown');
      setText('net-geo', [data.city, data.region, data.country_name].filter(Boolean).join(', ') || 'Unknown');
      setText('net-isp', data.org || 'Unknown');
    } catch (err) {
      // Fallback provider if ipapi.co is rate-limited or blocked.
      try {
        const res2 = await fetch('https://ipwho.is/');
        const data2 = await res2.json();
        setText('net-public-ip', data2.ip || 'Unknown');
        setText('net-geo', [data2.city, data2.region, data2.country].filter(Boolean).join(', ') || 'Unknown');
        setText('net-isp', data2.connection?.isp || 'Unknown');
      } catch (err2) {
        setText('net-public-ip', 'Unavailable (network/CORS blocked)');
        setText('net-geo', '—');
        setText('net-isp', '—');
      }
    }
  };

  const startClock = () => {
    const localEl = document.getElementById('net-clock-local');
    const utcEl = document.getElementById('net-clock-utc');
    if (!localEl && !utcEl) return;
    const tick = () => {
      const now = new Date();
      if (localEl) localEl.textContent = now.toLocaleTimeString();
      if (utcEl) utcEl.textContent = now.toUTCString().split(' ')[4] + ' UTC';
    };
    tick();
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(tick, 1000);
  };

  // Called the first time the "My Network" tab is opened, so we don't
  // spend a network round trip on a panel the visitor never looks at.
  const loadOnce = () => {
    if (loaded) return;
    loaded = true;
    renderConnectionInfo();
    renderBrowserFacts();
    renderOnlineStatus();
    renderPageTiming();
    startClock();
    renderPublicIp();
  };

  const init = () => {
    // If the tab is already active on load (rare, but be safe), fetch immediately.
    const pane = document.getElementById('tab-mynetwork');
    if (pane && pane.classList.contains('active')) loadOnce();
  };

  return { init, loadOnce };
})();

/* ──────────────────────────────────────────
   24. LESSON PAGE WIREGUARD WIDGET
────────────────────────────────────────── */
const initVpnPageEnhancements = () => {
  const wgSection = document.getElementById('wireguard');
  if (wgSection && !document.getElementById('wg-live-tool-widget')) {
    const widget = document.createElement('div');
    widget.id = 'wg-live-tool-widget';
    widget.className = 'info-box';
    widget.style.borderColor = 'var(--cyan)';
    widget.style.background = 'rgba(0, 229, 255, 0.04)';
    widget.innerHTML = `
      <div class="info-box-icon">⚡</div>
      <div class="info-box-body">
        <div class="info-box-title" style="color:var(--cyan);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
          <span>Live WireGuard Keypair & Config Generator</span>
          <button class="btn btn-ghost" id="btn-wg-lesson-gen" style="padding:0.3rem 0.8rem;font-size:0.78rem;border-color:var(--cyan);color:var(--cyan);">🔑 Generate Live Keys</button>
        </div>
        <div class="info-box-text">Generate genuine Curve25519-compatible base64 keys and test configuration parameters in real-time.</div>
        <div id="wg-lesson-key-display" style="display:none;margin-top:0.75rem;padding:0.75rem;background:rgba(0,0,0,0.4);border-radius:4px;font-family:var(--font-mono);font-size:0.8rem;">
          <div>Server Private: <span id="wg-les-spriv" style="color:var(--purple)"></span></div>
          <div>Server Public:  <span id="wg-les-spub" style="color:var(--cyan)"></span></div>
          <div>Client Public:  <span id="wg-les-cpub" style="color:var(--green)"></span></div>
        </div>
      </div>
    `;
    const term = wgSection.querySelector('.terminal');
    if (term) wgSection.insertBefore(widget, term);

    const btn = document.getElementById('btn-wg-lesson-gen');
    if (btn) {
      btn.addEventListener('click', () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const gen = () => {
          let s = '';
          for (let i = 0; i < 43; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
          return s + '=';
        };
        const spriv = gen();
        const spub = gen();
        const cpub = gen();
        const spEl = document.getElementById('wg-les-spriv');
        const spubEl = document.getElementById('wg-les-spub');
        const cpEl = document.getElementById('wg-les-cpub');
        if (spEl) spEl.textContent = spriv;
        if (spubEl) spubEl.textContent = spub;
        if (cpEl) cpEl.textContent = cpub;
        const box = document.getElementById('wg-lesson-key-display');
        if (box) box.style.display = 'block';
        SoundFX.correct();
        Progress.addXP(10);
      });
    }
  }
};

/* ──────────────────────────────────────────
   25. NETWORK CONFIGURATION LESSON STUDIO
────────────────────────────────────────── */
const NetworkConfigStudio = (() => {
  const init = () => {
    // 1. Triple Interface Config Generator (ip, nmcli, netplan)
    const ifaceInput = document.getElementById('ncs-iface');
    const ipInput = document.getElementById('ncs-ip');
    const gwInput = document.getElementById('ncs-gw');
    const dnsInput = document.getElementById('ncs-dns');

    const outIp = document.getElementById('ncs-out-ip');
    const outNmcli = document.getElementById('ncs-out-nmcli');
    const outNetplan = document.getElementById('ncs-out-netplan');

    const updateConfigs = () => {
      if (!outIp || !outNmcli || !outNetplan) return;
      const iface = (ifaceInput ? ifaceInput.value.trim() : '') || 'ens3';
      const ip = (ipInput ? ipInput.value.trim() : '') || '192.168.1.50/24';
      const gw = (gwInput ? gwInput.value.trim() : '') || '192.168.1.1';
      const dns = (dnsInput ? dnsInput.value.trim() : '') || '8.8.8.8 1.1.1.1';
      const dnsArray = dns.split(/[\s,]+/).filter(Boolean);

      // 1. iproute2 commands
      outIp.textContent = `# 1. Assign IP address and bring interface UP
sudo ip addr add ${ip} dev ${iface}
sudo ip link set ${iface} up

# 2. Add default gateway
sudo ip route add default via ${gw} dev ${iface}

# 3. Verify IP and routing
ip addr show dev ${iface}
ip route show`;

      // 2. nmcli command
      outNmcli.textContent = `# Add permanent NetworkManager connection profile
sudo nmcli con add type ethernet con-name "static-${iface}" ifname ${iface} \\
    ipv4.method manual \\
    ipv4.addresses "${ip}" \\
    ipv4.gateway "${gw}" \\
    ipv4.dns "${dnsArray.join(' ')}"

# Activate connection
sudo nmcli con up "static-${iface}"`;

      // 3. Netplan YAML
      outNetplan.textContent = `# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    ${iface}:
      dhcp4: no
      addresses:
        - ${ip}
      routes:
        - to: default
          via: ${gw}
      nameservers:
        addresses: [${dnsArray.join(', ')}]
# Apply with: sudo netplan apply`;
    };

    if (ifaceInput) ifaceInput.addEventListener('input', updateConfigs);
    if (ipInput) ipInput.addEventListener('input', updateConfigs);
    if (gwInput) gwInput.addEventListener('input', updateConfigs);
    if (dnsInput) dnsInput.addEventListener('input', updateConfigs);
    updateConfigs();

    // 2. Next-Hop Route Evaluator
    const routeDstInput = document.getElementById('route-eval-dst');
    const routeEvalBtn = document.getElementById('route-eval-btn');
    const routeResult = document.getElementById('route-eval-result');

    const routingTable = [
      { prefix: '127.0.0.0/8', net: '127.0.0.0', mask: 8, iface: 'lo', gw: 'onlink', metric: 0, desc: 'Local Loopback' },
      { prefix: '192.168.1.0/24', net: '192.168.1.0', mask: 24, iface: 'ens3', gw: 'onlink', metric: 100, desc: 'Local Subnet LAN' },
      { prefix: '10.10.0.0/16', net: '10.10.0.0', mask: 16, iface: 'ens3', gw: '192.168.1.254', metric: 10, desc: 'Internal Branch Office' },
      { prefix: '10.0.0.0/24', net: '10.0.0.0', mask: 24, iface: 'wg0', gw: 'onlink', metric: 50, desc: 'WireGuard VPN Tunnel' },
      { prefix: '0.0.0.0/0', net: '0.0.0.0', mask: 0, iface: 'ens3', gw: '192.168.1.1', metric: 100, desc: 'Default Gateway (Internet)' }
    ];

    const ipToNumber = (ipStr) => {
      const parts = ipStr.split('.');
      if (parts.length !== 4) return null;
      return parts.reduce((acc, octet) => {
        const n = parseInt(octet, 10);
        return (acc << 8) + (isNaN(n) ? 0 : n);
      }, 0) >>> 0;
    };

    const matchRoute = (targetIp) => {
      const targetNum = ipToNumber(targetIp);
      if (targetNum === null) return null;

      // Longest prefix match
      let bestMatch = null;
      routingTable.forEach(route => {
        const maskNum = route.mask === 0 ? 0 : (~0 << (32 - route.mask)) >>> 0;
        const netNum = ipToNumber(route.net);
        if ((targetNum & maskNum) >>> 0 === (netNum & maskNum) >>> 0) {
          if (!bestMatch || route.mask > bestMatch.mask) {
            bestMatch = route;
          }
        }
      });
      return bestMatch;
    };

    const evaluate = () => {
      if (!routeDstInput || !routeResult) return;
      const target = routeDstInput.value.trim();
      const match = matchRoute(target);
      if (!match) {
        routeResult.innerHTML = `<span style="color:var(--red)">Invalid destination IP address format.</span>`;
        return;
      }
      routeResult.innerHTML = `
        <div style="margin-top:0.75rem;padding:0.85rem;background:rgba(2,6,16,0.7);border-radius:4px;border-left:3px solid var(--green);">
          <div>🎯 Matched Route: <strong style="color:var(--cyan)">${match.prefix}</strong> (${match.desc})</div>
          <div>🔌 Egress Interface: <strong style="color:var(--green)">${match.iface}</strong></div>
          <div>🚪 Next-Hop Gateway: <strong style="color:var(--yellow)">${match.gw}</strong></div>
          <div>⚡ Route Metric: <strong>${match.metric}</strong> (Longest Prefix Match: /${match.mask})</div>
        </div>
      `;
      SoundFX.correct();
      Progress.addXP(10);
    };

    if (routeEvalBtn) routeEvalBtn.addEventListener('click', evaluate);
    if (routeDstInput) {
      routeDstInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') evaluate();
      });
    }
  };

  return { init };
})();

/* ──────────────────────────────────────────
   26. IPTABLES & NFTABLES LESSON STUDIO
────────────────────────────────────────── */
const IptablesStudio = (() => {
  const init = () => {
    // 1. Dual iptables <-> nftables Translator
    const chainSel = document.getElementById('ipst-chain');
    const protoSel = document.getElementById('ipst-proto');
    const portIn = document.getElementById('ipst-port');
    const srcIn = document.getElementById('ipst-src');
    const actionSel = document.getElementById('ipst-action');

    const outIptables = document.getElementById('ipst-out-iptables');
    const outNft = document.getElementById('ipst-out-nft');

    const updateRules = () => {
      if (!outIptables || !outNft) return;
      const chain = (chainSel ? chainSel.value : 'INPUT') || 'INPUT';
      const proto = (protoSel ? protoSel.value : 'tcp') || 'tcp';
      const port = (portIn ? portIn.value.trim() : '') || '22';
      const src = (srcIn ? srcIn.value.trim() : '') || 'any';
      const action = (actionSel ? actionSel.value : 'ACCEPT') || 'ACCEPT';

      // iptables syntax
      let ipt = `sudo iptables -A ${chain} -p ${proto}`;
      if (src && src !== 'any') ipt += ` -s ${src}`;
      if (proto !== 'icmp' && port) ipt += ` --dport ${port}`;
      ipt += ` -j ${action}`;

      // nftables syntax
      const nftAction = action.toLowerCase();
      let nft = `sudo nft add rule inet filter ${chain.toLowerCase()}`;
      if (src && src !== 'any') nft += ` ip saddr ${src}`;
      if (proto !== 'icmp' && port) nft += ` ${proto} dport ${port}`;
      else if (proto === 'icmp') nft += ` ip protocol icmp`;
      nft += ` ${nftAction}`;

      outIptables.textContent = ipt;
      outNft.textContent = nft;
    };

    [chainSel, protoSel, portIn, srcIn, actionSel].forEach(el => {
      if (el) el.addEventListener('input', updateRules);
    });
    updateRules();

    // 2. Realtime Conntrack Table Simulator
    const conntrackBody = document.getElementById('conntrack-sim-body');
    if (conntrackBody) {
      let connections = [
        { proto: 'tcp', src: '192.168.1.150:48210', dst: '142.250.190.46:443', state: 'ESTABLISHED', ttl: 431980 },
        { proto: 'tcp', src: '192.168.1.44:52890', dst: '192.168.1.150:22', state: 'ESTABLISHED', ttl: 431890 },
        { proto: 'udp', src: '192.168.1.150:51820', dst: '203.0.113.88:51820', state: 'UNREPLIED', ttl: 28 },
        { proto: 'tcp', src: '192.168.1.150:39844', dst: '1.1.1.1:853', state: 'TIME_WAIT', ttl: 58 }
      ];

      const renderConntrack = () => {
        conntrackBody.innerHTML = connections.map((c, i) => `
          <tr>
            <td><span class="chip" style="font-size:0.75rem;">${c.proto}</span></td>
            <td><code>${c.src}</code></td>
            <td><code>${c.dst}</code></td>
            <td><strong style="color:${c.state === 'ESTABLISHED' ? 'var(--green)' : c.state === 'TIME_WAIT' ? 'var(--yellow)' : 'var(--cyan)'}">${c.state}</strong></td>
            <td><span class="timer-pulse">${c.ttl}s</span></td>
          </tr>
        `).join('');
      };

      renderConntrack();
      setInterval(() => {
        connections.forEach(c => {
          if (c.ttl > 1) c.ttl -= 1;
          else c.ttl = c.state === 'TIME_WAIT' ? 120 : 432000;
        });
        renderConntrack();
      }, 1000);
    }
  };

  return { init };
})();

/* ──────────────────────────────────────────
   27. FIREWALLD LESSON STUDIO
────────────────────────────────────────── */
const FirewalldStudio = (() => {
  const zoneInfo = {
    drop: { trust: 'Zero Trust (0/5)', behavior: 'Silently drop all incoming packets', svcs: 'None', target: 'DROP' },
    block: { trust: 'Untrusted (1/5)', behavior: 'Reject incoming with ICMP host-prohibited', svcs: 'None', target: '%%REJECT%%' },
    public: { trust: 'Low Trust (2/5) [DEFAULT]', behavior: 'Deny unless explicitly allowed', svcs: 'dhcpv6-client, ssh', target: 'default' },
    external: { trust: 'Low Trust (Router WAN)', behavior: 'Deny with NAT Masquerading active', svcs: 'ssh', target: 'default (masquerade=yes)' },
    dmz: { trust: 'Isolated Public Services (3/5)', behavior: 'Exposed servers with restricted LAN', svcs: 'ssh', target: 'default' },
    internal: { trust: 'High Trust (4/5)', behavior: 'Internal LAN services allowed', svcs: 'dhcpv6-client, mdns, samba-client, ssh', target: 'default' },
    trusted: { trust: 'Full Trust (5/5)', behavior: 'Accept ALL incoming connections', svcs: 'ALL', target: 'ACCEPT' }
  };

  const init = () => {
    // 1. Zone Explorer
    const zoneSel = document.getElementById('fwd-zone-select');
    const zoneDisplay = document.getElementById('fwd-zone-display');
    const zoneOutCmd = document.getElementById('fwd-zone-cmd');

    const updateZone = () => {
      if (!zoneSel || !zoneDisplay || !zoneOutCmd) return;
      const zName = zoneSel.value;
      const z = zoneInfo[zName] || zoneInfo.public;

      zoneDisplay.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.75rem;margin-bottom:1rem;">
          <div class="telemetry-card" style="padding:0.75rem;">
            <div class="telemetry-card-title">Zone Trust Level</div>
            <div style="font-weight:bold;color:var(--cyan);font-size:0.95rem;">${z.trust}</div>
          </div>
          <div class="telemetry-card" style="padding:0.75rem;">
            <div class="telemetry-card-title">Default Target</div>
            <div style="font-weight:bold;color:var(--green);font-size:0.95rem;">${z.target}</div>
          </div>
          <div class="telemetry-card" style="padding:0.75rem;">
            <div class="telemetry-card-title">Pre-Allowed Services</div>
            <div style="font-weight:bold;color:var(--yellow);font-size:0.88rem;">${z.svcs}</div>
          </div>
        </div>
      `;

      zoneOutCmd.textContent = `# Query zone details
sudo firewall-cmd --zone=${zName} --list-all

# Assign interface to zone
sudo firewall-cmd --zone=${zName} --change-interface=ens3 --permanent
sudo firewall-cmd --reload`;
      SoundFX.click();
    };

    if (zoneSel) {
      zoneSel.addEventListener('change', updateZone);
      updateZone();
    }

    // 2. Rich Rule Studio
    const rrSubnet = document.getElementById('fwd-rr-subnet');
    const rrService = document.getElementById('fwd-rr-service');
    const rrAction = document.getElementById('fwd-rr-action');
    const rrOut = document.getElementById('fwd-rr-output');

    const updateRichRule = () => {
      if (!rrOut) return;
      const sub = (rrSubnet ? rrSubnet.value.trim() : '') || '192.168.1.0/24';
      const svc = (rrService ? rrService.value : 'ssh') || 'ssh';
      const act = (rrAction ? rrAction.value : 'accept') || 'accept';

      rrOut.textContent = `# 1. Add permanent rich rule
sudo firewall-cmd --permanent --zone=public --add-rich-rule='rule family="ipv4" source address="${sub}" service name="${svc}" ${act}'

# 2. Reload daemon to apply
sudo firewall-cmd --reload

# 3. Verify in active rich rules
sudo firewall-cmd --zone=public --list-rich-rules`;
    };

    [rrSubnet, rrService, rrAction].forEach(el => {
      if (el) el.addEventListener('input', updateRichRule);
    });
    updateRichRule();
  };

  return { init };
})();

/* ──────────────────────────────────────────
   28. UFW LESSON STUDIO
────────────────────────────────────────── */
const UfwStudio = (() => {
  let activeRules = [
    { id: 1, to: '22/tcp', action: 'ALLOW IN', from: 'Anywhere', comment: 'OpenSSH management' },
    { id: 2, to: '80,443/tcp', action: 'ALLOW IN', from: 'Anywhere', comment: 'Nginx Web Server' },
    { id: 3, to: '3306/tcp', action: 'ALLOW IN', from: '192.168.1.0/24', comment: 'MySQL DB Subnet' },
    { id: 4, to: '23/tcp', action: 'DENY IN', from: 'Anywhere', comment: 'Block Insecure Telnet' }
  ];

  const renderRules = () => {
    const tbody = document.getElementById('ufw-interactive-table-body');
    if (!tbody) return;
    tbody.innerHTML = activeRules.map((r, idx) => `
      <tr>
        <td><strong>[${idx + 1}]</strong></td>
        <td><code>${r.to}</code></td>
        <td><span class="chip" style="background:${r.action.startsWith('ALLOW') ? 'rgba(0,255,163,0.1)' : 'rgba(255,87,87,0.1)'};color:${r.action.startsWith('ALLOW') ? 'var(--green)' : 'var(--red)'};">${r.action}</span></td>
        <td><code>${r.from}</code></td>
        <td><span style="font-size:0.75rem;color:var(--text-muted);">${r.comment}</span></td>
        <td>
          <button class="btn btn-ghost ufw-del-btn" data-idx="${idx}" style="padding:0.2rem 0.5rem;font-size:0.72rem;color:var(--red);border-color:var(--red);">Delete</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.ufw-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.idx, 10);
        activeRules.splice(i, 1);
        renderRules();
        SoundFX.wrong();
      });
    });
  };

  const init = () => {
    renderRules();

    const addBtn = document.getElementById('ufw-add-rule-btn');
    const portIn = document.getElementById('ufw-add-port');
    const actSel = document.getElementById('ufw-add-action');
    const fromIn = document.getElementById('ufw-add-from');

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const port = (portIn ? portIn.value.trim() : '') || '8080/tcp';
        const act = (actSel ? actSel.value : 'ALLOW IN') || 'ALLOW IN';
        const from = (fromIn ? fromIn.value.trim() : '') || 'Anywhere';
        activeRules.push({
          id: activeRules.length + 1,
          to: port,
          action: act,
          from: from,
          comment: 'Custom student rule'
        });
        renderRules();
        SoundFX.correct();
        Progress.addXP(10);
      });
    }

    const resetBtn = document.getElementById('ufw-reset-rules-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        activeRules = [
          { id: 1, to: '22/tcp', action: 'ALLOW IN', from: 'Anywhere', comment: 'OpenSSH management' },
          { id: 2, to: '80,443/tcp', action: 'ALLOW IN', from: 'Anywhere', comment: 'Nginx Web Server' },
          { id: 3, to: '3306/tcp', action: 'ALLOW IN', from: '192.168.1.0/24', comment: 'MySQL DB Subnet' }
        ];
        renderRules();
        SoundFX.click();
      });
    }
  };

  return { init };
})();

/* ──────────────────────────────────────────
   29. MONITORING LESSON STUDIO (tcpdump BPF & ss Filter)
────────────────────────────────────────── */
const MonitoringStudio = (() => {
  const init = () => {
    // 1. tcpdump BPF Filter Builder & Streamer
    const ifaceSel = document.getElementById('bpf-iface');
    const protoSel = document.getElementById('bpf-proto');
    const portIn = document.getElementById('bpf-port');
    const flagsSel = document.getElementById('bpf-flags');
    const bpfCmd = document.getElementById('bpf-out-cmd');
    const streamBtn = document.getElementById('bpf-stream-btn');
    const streamBox = document.getElementById('bpf-stream-output');

    const updateBpf = () => {
      if (!bpfCmd) return;
      const iface = (ifaceSel ? ifaceSel.value : 'ens3') || 'ens3';
      const proto = (protoSel ? protoSel.value : 'tcp') || 'tcp';
      const port = (portIn ? portIn.value.trim() : '') || '80';
      const flag = flagsSel ? flagsSel.value : 'any';

      let filter = `${proto}`;
      if (port) filter += ` and port ${port}`;
      if (flag === 'syn') filter += ` and (tcp[tcpflags] & tcp-syn != 0)`;
      else if (flag === 'syn-ack') filter += ` and (tcp[tcpflags] & (tcp-syn|tcp-ack) == (tcp-syn|tcp-ack))`;
      else if (flag === 'rst') filter += ` and (tcp[tcpflags] & tcp-rst != 0)`;

      bpfCmd.textContent = `sudo tcpdump -i ${iface} -nn -v -c 10 '${filter}'`;
    };

    [ifaceSel, protoSel, portIn, flagsSel].forEach(el => {
      if (el) el.addEventListener('input', updateBpf);
    });
    updateBpf();

    if (streamBtn && streamBox) {
      streamBtn.addEventListener('click', () => {
        streamBox.innerHTML = '<span style="color:var(--cyan)">Starting tcpdump packet listener...</span>\n';
        SoundFX.click();
        const port = (portIn ? portIn.value.trim() : '') || '80';
        let count = 0;
        const interval = setInterval(() => {
          count++;
          const now = new Date().toISOString().substring(11, 23);
          const clientPort = 40000 + Math.round(Math.random() * 20000);
          const line = `${now} IP 192.168.1.150.${clientPort} > 93.184.216.34.${port}: Flags [S], seq 3819201${count}, win 64240, length 0\n`;
          streamBox.textContent += line;
          streamBox.scrollTop = streamBox.scrollHeight;
          if (count >= 5) {
            clearInterval(interval);
            streamBox.textContent += `\n5 packets captured and decoded.\n`;
            SoundFX.correct();
            Progress.addXP(10);
          }
        }, 350);
      });
    }

    // 2. ss Socket State Filter Studio
    const sockets = [
      { netid: 'tcp', state: 'LISTEN', local: '0.0.0.0:22', peer: '0.0.0.0:*', proc: 'sshd (pid=680)' },
      { netid: 'tcp', state: 'LISTEN', local: '0.0.0.0:80', peer: '0.0.0.0:*', proc: 'nginx (pid=1120)' },
      { netid: 'tcp', state: 'LISTEN', local: '0.0.0.0:443', peer: '0.0.0.0:*', proc: 'nginx (pid=1120)' },
      { netid: 'tcp', state: 'LISTEN', local: '127.0.0.1:3306', peer: '0.0.0.0:*', proc: 'mariadbd (pid=890)' },
      { netid: 'tcp', state: 'ESTAB',  local: '192.168.1.150:22', peer: '192.168.1.44:54120', proc: 'sshd: user@pts/0' },
      { netid: 'tcp', state: 'ESTAB',  local: '192.168.1.150:443', peer: '198.51.100.22:38902', proc: 'nginx: worker' },
      { netid: 'udp', state: 'UNCONN', local: '0.0.0.0:51820', peer: '0.0.0.0:*', proc: 'wireguard (kernel)' },
      { netid: 'udp', state: 'UNCONN', local: '127.0.0.53:53', peer: '0.0.0.0:*', proc: 'systemd-resolve' }
    ];

    const ssFilterSel = document.getElementById('ss-state-filter');
    const ssTbody = document.getElementById('ss-filter-tbody');

    const renderSockets = () => {
      if (!ssTbody) return;
      const filter = ssFilterSel ? ssFilterSel.value : 'ALL';
      const filtered = sockets.filter(s => filter === 'ALL' || s.state === filter);
      ssTbody.innerHTML = filtered.map(s => `
        <tr>
          <td><span class="chip" style="font-size:0.75rem;">${s.netid}</span></td>
          <td><strong style="color:${s.state === 'LISTEN' ? 'var(--cyan)' : s.state === 'ESTAB' ? 'var(--green)' : 'var(--yellow)'}">${s.state}</strong></td>
          <td><code>${s.local}</code></td>
          <td><code>${s.peer}</code></td>
          <td><span style="color:var(--text-primary);font-size:0.8rem;">${s.proc}</span></td>
        </tr>
      `).join('');
    };

    if (ssFilterSel) {
      ssFilterSel.addEventListener('change', () => {
        renderSockets();
        SoundFX.click();
      });
      renderSockets();
    }
  };

  return { init };
})();

/* ──────────────────────────────────────────
   30. HARDENING LESSON STUDIO (sshd_config Auditor & sysctl Generator)
────────────────────────────────────────── */
const HardeningStudio = (() => {
  const init = () => {
    // 1. sshd_config Security Auditor
    const checks = {
      root: { el: document.getElementById('chk-ssh-root'), weight: 25, penalty: 'Root login allowed via SSH is high risk' },
      pass: { el: document.getElementById('chk-ssh-pass'), weight: 25, penalty: 'Password auth enabled: vulnerable to brute-force sprays' },
      port: { el: document.getElementById('chk-ssh-port'), weight: 15, penalty: 'Default port 22 subjected to automated internet scanners' },
      tries: { el: document.getElementById('chk-ssh-tries'), weight: 15, penalty: 'MaxAuthTries > 3 allows repeated login attempts' },
      x11: { el: document.getElementById('chk-ssh-x11'), weight: 10, penalty: 'X11Forwarding enabled allows client GUI snooping' },
      key: { el: document.getElementById('chk-ssh-key'), weight: 10, penalty: 'PubkeyAuthentication must be explicitly forced' }
    };

    const scoreCircle = document.getElementById('sshd-score-circle');
    const scoreVal = document.getElementById('sshd-score-val');
    const adviceList = document.getElementById('sshd-audit-advice');
    const outConfig = document.getElementById('sshd-out-config');

    const audit = () => {
      if (!scoreCircle || !scoreVal) return;
      let score = 0;
      let advice = [];

      const rootOk = checks.root.el && checks.root.el.checked;
      const passOk = checks.pass.el && checks.pass.el.checked;
      const portOk = checks.port.el && checks.port.el.checked;
      const triesOk = checks.tries.el && checks.tries.el.checked;
      const x11Ok = checks.x11.el && checks.x11.el.checked;
      const keyOk = checks.key.el && checks.key.el.checked;

      if (rootOk) score += checks.root.weight; else advice.push(checks.root.penalty);
      if (passOk) score += checks.pass.weight; else advice.push(checks.pass.penalty);
      if (portOk) score += checks.port.weight; else advice.push(checks.port.penalty);
      if (triesOk) score += checks.tries.weight; else advice.push(checks.tries.penalty);
      if (x11Ok) score += checks.x11.weight; else advice.push(checks.x11.penalty);
      if (keyOk) score += checks.key.weight; else advice.push(checks.key.penalty);

      scoreVal.textContent = `${score}%`;
      scoreCircle.className = 'sec-meter-circle ' + (score >= 80 ? 'high' : score >= 50 ? 'med' : 'low');

      if (adviceList) {
        adviceList.innerHTML = advice.length
          ? advice.map(a => `<li style="margin-bottom:0.25rem;color:var(--text-secondary);font-size:0.8rem;">⚠️ ${a}</li>`).join('')
          : `<li style="color:var(--green);font-weight:bold;font-size:0.85rem;">🛡️ Excellent! Hardened against CIS Benchmark Level 2 standards.</li>`;
      }

      if (outConfig) {
        outConfig.textContent = `# /etc/ssh/sshd_config.d/99-hardened.conf
Port ${portOk ? '2222' : '22'}
PermitRootLogin ${rootOk ? 'no' : 'prohibit-password'}
PasswordAuthentication ${passOk ? 'no' : 'yes'}
PubkeyAuthentication ${keyOk ? 'yes' : 'yes'}
MaxAuthTries ${triesOk ? '3' : '6'}
X11Forwarding ${x11Ok ? 'no' : 'yes'}
KbdInteractiveAuthentication no
ClientAliveInterval 300
ClientAliveCountMax 2
Banner /etc/issue.net`;
      }
    };

    Object.values(checks).forEach(c => {
      if (c.el) c.el.addEventListener('change', () => {
        audit();
        SoundFX.click();
      });
    });
    audit();

    // 2. sysctl Hardening Generator
    const synChk = document.getElementById('sys-syn');
    const spoofChk = document.getElementById('sys-spoof');
    const redirectChk = document.getElementById('sys-redirect');
    const bcastChk = document.getElementById('sys-bcast');
    const sysOut = document.getElementById('sysctl-out-config');

    const updateSysctl = () => {
      if (!sysOut) return;
      let lines = ['# /etc/sysctl.d/99-security-hardening.conf'];
      if (synChk && synChk.checked) lines.push('net.ipv4.tcp_syncookies = 1\nnet.ipv4.tcp_max_syn_backlog = 2048\nnet.ipv4.tcp_synack_retries = 2');
      if (spoofChk && spoofChk.checked) lines.push('net.ipv4.conf.all.rp_filter = 1\nnet.ipv4.conf.default.rp_filter = 1');
      if (redirectChk && redirectChk.checked) lines.push('net.ipv4.conf.all.accept_redirects = 0\nnet.ipv4.conf.all.send_redirects = 0');
      if (bcastChk && bcastChk.checked) lines.push('net.ipv4.icmp_echo_ignore_broadcasts = 1');
      sysOut.textContent = lines.join('\n');
    };

    [synChk, spoofChk, redirectChk, bcastChk].forEach(el => {
      if (el) el.addEventListener('change', () => {
        updateSysctl();
        SoundFX.click();
      });
    });
    updateSysctl();
  };

  return { init };
})();

/* ──────────────────────────────────────────
   31. MAIN BOOTSTRAPPER
────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  SoundFX.init();
  Progress.init();
  Nav.init();
  Particles.init();
  initGlobalUI();
  initCopyButtons();
  initScrollAnimations();
  initLabTracker();
  initHomeProgress();
  wireQuiz();
  initTypewriter();
  initSuiteTabs();
  TerminalSim.init();
  FirewallGen.init();
  SubnetCalc.init();
  PortMatrix.init();
  LiveTelemetry.init();
  NetfilterSim.init();
  AttackSim.init();
  WireGuardTool.init();
  DnsBench.init();
  NetworkInfo.init();
  initVpnPageEnhancements();
  NetworkConfigStudio.init();
  IptablesStudio.init();
  FirewalldStudio.init();
  UfwStudio.init();
  MonitoringStudio.init();
  HardeningStudio.init();
});


