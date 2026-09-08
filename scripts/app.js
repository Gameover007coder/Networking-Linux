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
  let canvas, ctx, particles = [], animId;

  const init = () => {
    canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    particles = [];
    for (let i = 0; i < 55; i++) particles.push(newParticle());
    loop();
    window.addEventListener('resize', resize);
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

      SoundFX.click();
    });
  });
};

/* ──────────────────────────────────────────
   19. MAIN BOOTSTRAPPER
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
});
