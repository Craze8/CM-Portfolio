  // mouse glow (fine pointers only, respects reduced motion)
  (function(){
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const glow = document.createElement('div');
    glow.className = 'mouse-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    let tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty, raf = null;

    function loop(){
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      glow.style.transform = 'translate(' + cx + 'px, ' + cy + 'px) translate(-50%, -50%)';
      if (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) raf = requestAnimationFrame(loop);
      else raf = null;
    }
    window.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      glow.style.opacity = 1;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('mouseleave', () => { glow.style.opacity = 0; });
  })();

  // mobile menu (iris reveal from the burger button)
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  function setMenu(open){
    if (open) {
      const r = burger.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const radius = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
      mobileMenu.style.setProperty('--ix', cx + 'px');
      mobileMenu.style.setProperty('--iy', cy + 'px');
      mobileMenu.style.setProperty('--is', Math.ceil(radius / 20) + 1);   // 40px circle scaled to cover the screen
    }
    document.documentElement.classList.toggle('menu-open', open);
    // pause any video playing behind the menu; resume it when the menu closes
    document.querySelectorAll('video').forEach((v) => {
      if (open && !v.paused) { v.dataset.menuPaused = '1'; v.pause(); }
      else if (!open && v.dataset.menuPaused) { delete v.dataset.menuPaused; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
    });
    burger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    mobileMenu.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
  const mmBack = document.getElementById('mmBack');
  if (mmBack) mmBack.addEventListener('click', () => setMenu(false));
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) setMenu(false);
  });

  // scroll progress bar + darkened navbar background once scrolled
  const progressBar = document.getElementById('progressBar');
  const siteHeader = document.getElementById('siteHeader');
  function onScroll(){
    const h = document.documentElement;
    const scrolled = h.scrollTop || document.body.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    progressBar.style.width = (height > 0 ? (scrolled / height) * 100 : 0) + '%';
    siteHeader.classList.toggle('scrolled', scrolled > 40);
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // scrollspy + liquid sliding highlight
  const navLinksWrap = document.getElementById('navLinks');
  const navLiquid = document.getElementById('navLiquid');
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[data-section]'));
  // sub-pages set <body data-page="work"> so the right link starts highlighted
  let activeLink = navLinks.find(a => a.dataset.section === document.body.dataset.page) || navLinks[0];

  function moveLiquid(target){
    if (!target || !navLinksWrap) return;
    const rect = target.getBoundingClientRect();
    const parentRect = navLinksWrap.getBoundingClientRect();
    navLiquid.style.opacity = 1;
    navLiquid.style.width = rect.width + 'px';
    navLiquid.style.transform = 'translateX(' + (rect.left - parentRect.left) + 'px)';
    navLinks.forEach(a => a.classList.toggle('is-lit', a === target));
  }

  navLinks.forEach(a => {
    a.addEventListener('mouseenter', () => moveLiquid(a));
  });
  navLinksWrap.addEventListener('mouseleave', () => moveLiquid(activeLink));
  // close the Work dropdown once a link in it is clicked (it reopens on the next hover)
  document.querySelectorAll('.nav-drop').forEach(d => {
    d.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { d.classList.add('is-closed'); a.blur(); }));
    d.addEventListener('mouseleave', () => d.classList.remove('is-closed'));
  });

  // each nav link watches its own section plus any extra ones listed in data-also (Work also covers the AI-coded sections)
  const spyMap = [];
  navLinks.forEach(a => [a.dataset.section].concat((a.dataset.also || '').split(' ')).forEach(id => {
    const el = id && document.getElementById(id);
    if (el) spyMap.push([el, a]);
  }));
  const spySections = spyMap.map(x => x[0]);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const hit = spyMap.find(x => x[0] === entry.target), link = hit && hit[1];
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach(a => a.classList.remove('active'));
        link.classList.add('active');
        activeLink = link;
        if (!navLinksWrap.matches(':hover')) moveLiquid(activeLink);
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  spySections.forEach(s => spy.observe(s));

  window.addEventListener('load', () => moveLiquid(activeLink));
  window.addEventListener('resize', () => moveLiquid(activeLink));

  // faq accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => {
        o.classList.remove('open');
        o.querySelector('.faq-a').style.maxHeight = null;
        o.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // service explorer: each group has its own tab list; a switch on top flips between Duda and Claude Code
  const arrowNav = (list, i, e, pick) => {
    let next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % list.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + list.length) % list.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = list.length - 1;
    if (next !== null) { e.preventDefault(); pick(next); list[next].focus(); }
  };
  document.querySelectorAll('.svc-explorer').forEach(ex => {
    const tabs = Array.from(ex.querySelectorAll('.svc-tab'));
    const panels = Array.from(ex.querySelectorAll('.svc-panel'));
    const pick = (i) => {
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach((p, k) => { p.classList.toggle('active', k === i); p.hidden = k !== i; });
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => pick(i));
      tab.addEventListener('keydown', (e) => arrowNav(tabs, i, e, pick));
    });
  });
  const svcSw = Array.from(document.querySelectorAll('.svc-sw'));
  const svcGroups = svcSw.map(b => document.getElementById(b.getAttribute('aria-controls')));
  const pickGroup = (i) => {
    svcSw.forEach((b, k) => { b.setAttribute('aria-selected', k === i); b.tabIndex = k === i ? 0 : -1; });
    svcGroups.forEach((g, k) => { if (g) g.hidden = k !== i; });
  };
  svcSw.forEach((b, i) => {
    b.addEventListener('click', () => pickGroup(i));
    b.addEventListener('keydown', (e) => arrowNav(svcSw, i, e, pickGroup));
  });

  // stack cards (tap / keyboard to pin open; hover handled by CSS)
  document.querySelectorAll('.stack-card').forEach((card, i) => {
    const role = card.querySelector('.sc-role');
    if (role) { role.id = 'sc-role-' + i; card.setAttribute('aria-controls', role.id); }
    card.addEventListener('click', () => {
      const open = card.classList.toggle('open');
      card.setAttribute('aria-expanded', open);
    });
  });

  // scroll reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* vibe-coding: big screen plays the selected card; cards show a still frame and preview on hover */
(() => {
  const $ = (id) => document.getElementById(id);
  const sec = $('vibe-coding'), picks = $('vibe-builds'), grid = $('vibeGrid'), stage = $('vibeStage');
  if (!sec || !grid || !stage) return;
  const video = $('vibeVideo'), screen = $('vibeScreen'), toggle = $('vibeToggle'), fsBtn = $('vibeFs');
  const nextFill = $('vibeNextFill'), nextName = $('vibeNextName');
  const bar = $('vibeBar'), tc = $('vibeTc'), cmd = $('vibeCmd'), num = $('vibeNum'), nameEl = $('vibeName'), tagEl = $('vibeTag'), cap = $('vibeCaption');
  const cards = Array.from(grid.querySelectorAll('.vibe-card'));
  const thumbs = cards.map((c) => c.querySelector('video'));
  const n = cards.length;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pad = (x) => String(x).padStart(2, '0');
  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); };
  let current = -1, inView = false, userPaused = reduce, raf = 0, typeT = 0, hoverT = 0;
  video.muted = true;

  const setPaused = (p) => { sec.classList.toggle('is-paused', p); if (picks) picks.classList.toggle('is-paused', p); toggle.setAttribute('aria-label', p ? 'Play video' : 'Pause video'); };
  const paint = () => {
    const c = cards[current]; if (!c) return;
    const d = video.duration || +c.dataset.dur || 0, p = d ? Math.min(video.currentTime / d, 1) : 0;
    bar.style.transform = 'scaleX(' + p + ')';
    tc.textContent = fmt(video.currentTime) + ' / ' + fmt(d);
    c.style.setProperty('--p', p);
    if (nextFill) nextFill.style.setProperty('--p', p);
  };
  const tick = () => { paint(); raf = requestAnimationFrame(tick); };
  const type = (text) => {
    clearInterval(typeT);
    if (reduce) { cmd.textContent = text; return; }
    let i = 0; cmd.textContent = '';
    typeT = setInterval(() => { cmd.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typeT); }, 24);
  };
  const tryPlay = () => {
    if (userPaused || !inView) return;
    const pr = video.play();
    if (pr && pr.catch) pr.catch(() => { screen.classList.remove('is-loading'); setPaused(true); });
  };
  const attachThumb = (i) => { const v = thumbs[i]; if (v && !v.getAttribute('src')) { v.muted = true; v.preload = 'auto'; v.src = v.dataset.src; } };
  const stopPreview = (i) => { const v = thumbs[i]; if (!v || !v.getAttribute('src')) return; v.pause(); try { v.currentTime = 0; } catch (e) {} };

  const load = (i) => {
    i = (i + n) % n;
    cards.forEach((c, k) => { c.classList.toggle('is-active', k === i); c.querySelector('.vc-hit').setAttribute('aria-pressed', k === i ? 'true' : 'false'); c.style.setProperty('--p', 0); });
    stopPreview(i);
    current = i;
    const c = cards[i];
    num.textContent = pad(i + 1);
    nameEl.textContent = c.dataset.name;
    if (nextName) nextName.textContent = cards[(i + 1) % n].dataset.name;
    if (nextFill) nextFill.style.setProperty('--p', 0);
    tagEl.textContent = c.dataset.sector;
    cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
    type(c.dataset.slug);
    video.setAttribute('aria-label', c.dataset.name + ' website screen recording');
    if (c.dataset.poster) video.poster = c.dataset.poster;
    video.preload = 'auto';
    video.src = c.dataset.src;
    if (!userPaused && inView) screen.classList.add('is-loading');
    paint();
    tryPlay();
  };
  const showStage = () => {
    const r = screen.getBoundingClientRect(), vh = window.innerHeight;
    if (r.top >= 70 && r.bottom <= vh) return;
    window.scrollTo({ top: window.scrollY + r.top - Math.max(90, (vh - r.height) / 2), behavior: reduce ? 'auto' : 'smooth' });
  };

  video.addEventListener('loadeddata', () => { screen.classList.remove('is-loading'); paint(); });
  video.addEventListener('error', () => screen.classList.remove('is-loading'));
  video.addEventListener('play', () => { setPaused(false); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); });
  video.addEventListener('pause', () => { setPaused(true); cancelAnimationFrame(raf); paint(); });
  video.addEventListener('ended', () => load(current + 1));

  const togglePlay = () => {
    inView = true;
    if (current < 0) { userPaused = false; load(0); return; }
    if (video.paused) { userPaused = false; tryPlay(); }
    else { userPaused = true; video.pause(); }
  };
  const go = (i) => { userPaused = false; inView = true; load(i); };
  toggle.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
  screen.addEventListener('click', togglePlay);
  $('vibePrev').addEventListener('click', () => go(current - 1));
  $('vibeNext').addEventListener('click', () => go(current + 1));

  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  fsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    if (screen.requestFullscreen) screen.requestFullscreen();
    else if (screen.webkitRequestFullscreen) screen.webkitRequestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  });

  cards.forEach((c, i) => {
    c.addEventListener('click', (e) => {
      if (e.target.closest('.vc-visit')) return;
      clearTimeout(hoverT); stopPreview(i);
      if (i === current) { userPaused = false; inView = true; tryPlay(); }
      else go(i);
      showStage();
    });
    if (canHover && !reduce) {
      c.addEventListener('mouseenter', () => {
        clearTimeout(hoverT);
        if (i === current) return;
        hoverT = setTimeout(() => { attachThumb(i); const pr = thumbs[i].play(); if (pr && pr.catch) pr.catch(() => {}); }, 150);
      });
      c.addEventListener('mouseleave', () => { clearTimeout(hoverT); stopPreview(i); });
    }
  });

  // still frames are attached only when the section gets close (keeps them off the first page load)
  const posterIO = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    thumbs.forEach((v, k) => { if (!v.getAttribute('poster')) v.poster = cards[k].dataset.poster; });
    if (!video.getAttribute('poster')) video.poster = cards[current < 0 ? 0 : current].dataset.poster;
    posterIO.disconnect();
  }, { rootMargin: '900px 0px' });
  posterIO.observe(stage); posterIO.observe(grid);

  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView) { if (current < 0) load(0); else tryPlay(); }
    else if (!video.paused) video.pause();
  }, { threshold: 0.35 }).observe(screen);
})();

/* case studies: stack on scroll (the panel underneath shrinks and dims as the next one covers it) */
(() => {
  const wrap = document.querySelector('.cases');
  if (!wrap) return;
  const cards = Array.from(wrap.querySelectorAll('.featured'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;
  // a panel taller than the screen (phones) scrolls fully into view first, then sticks by its
  // bottom edge while the next one slides over it, so the stack works everywhere and nothing is hidden
  let lastW = 0;
  const fit = () => {
    lastW = window.innerWidth;
    const vh = window.innerHeight;
    cards.forEach((c) => {
      c.classList.remove('no-stick');
      c.style.top = '';
      const top = parseFloat(getComputedStyle(c).top) || 0;
      const room = vh - 12 - c.offsetHeight;
      if (room < top) c.style.top = Math.round(room) + 'px';
    });
  };
  const update = () => {
    ticking = false;
    if (reduce) return;
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      let p = 0;
      if (next) {
        const r = c.getBoundingClientRect(), n = next.getBoundingClientRect();
        p = Math.min(Math.max((r.bottom - n.top) / r.height, 0), 1);
      }
      c.style.setProperty('--stack', p.toFixed(3));
    });
  };
  // side index (desktop): one dot per case study, shows where you are and jumps to any panel
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
  const idx = document.createElement('nav');
  idx.className = 'case-index';
  idx.setAttribute('aria-label', 'Jump to a case study');
  const dots = cards.map((c, i) => {
    const b = document.createElement('button');
    const name = (c.querySelector('.fx-title') || {}).textContent || '';
    b.type = 'button';
    b.className = 'ci-dot';
    b.style.setProperty('--acc', getComputedStyle(c).getPropertyValue('--acc'));
    b.setAttribute('aria-label', 'Case study ' + pad2(i + 1) + ': ' + name);
    const label = document.createElement('span'), num = document.createElement('b');
    label.className = 'ci-name'; num.textContent = pad2(i + 1);
    label.appendChild(num); label.appendChild(document.createTextNode(name));
    b.appendChild(label);
    b.addEventListener('click', () => {
      // natural (un-stuck) position of panel i, then scroll so it lands at its sticky top
      let y = wrap.getBoundingClientRect().top + window.scrollY;
      for (let k = 0; k < i; k++) y += cards[k].offsetHeight + (parseFloat(getComputedStyle(cards[k]).marginBottom) || 0);
      const top = parseFloat(getComputedStyle(c).top) || 0;
      window.scrollTo({ top: Math.max(0, y - top + 2), behavior: reduce ? 'auto' : 'smooth' });
    });
    idx.appendChild(b);
    return b;
  });
  document.body.appendChild(idx);
  const syncIndex = () => {
    const vh = window.innerHeight, w = wrap.getBoundingClientRect();
    idx.classList.toggle('show', w.top < vh * 0.55 && w.bottom > vh * 0.45);
    let on = 0;
    cards.forEach((c, i) => { if (c.getBoundingClientRect().top <= vh * 0.45) on = i; });
    dots.forEach((d, i) => d.classList.toggle('is-on', i === on));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { update(); syncIndex(); }); } };
  fit(); update(); syncIndex();
  window.addEventListener('scroll', onScroll, { passive: true });
  // phone toolbars change the height while scrolling; only re-measure when the width changes
  window.addEventListener('resize', () => { if (window.innerWidth !== lastW) fit(); update(); });
  window.addEventListener('load', () => { fit(); update(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fit(); update(); });
})();

/* Duda page showcase: the project in the middle of the screen drives the big browser on the left */
(() => {
  const sx = document.querySelector('.sx');
  if (!sx) return;
  const items = Array.from(sx.querySelectorAll('.sx-item'));
  const imgs = Array.from(sx.querySelectorAll('.sx-screens img'));
  const segs = Array.from(sx.querySelectorAll('.sx-seg'));
  const dev = sx.querySelector('.sx-device'), urlText = sx.querySelector('.sx-url-text'), count = sx.querySelector('.sx-count b');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => (n < 10 ? '0' : '') + n;
  let cur = -1;
  const set = (i) => {
    if (i === cur || i < 0) return;
    imgs.forEach((im, k) => { im.classList.toggle('was-on', k === cur); im.classList.toggle('is-on', k === i); });
    items.forEach((it, k) => it.classList.toggle('is-on', k === i));
    segs.forEach((sg, k) => sg.classList.toggle('is-on', k === i));
    const it = items[i];
    sx.style.setProperty('--sx-acc', it.style.getPropertyValue('--acc'));
    if (urlText) urlText.textContent = it.dataset.host;
    if (dev) dev.href = it.dataset.href;
    if (count) count.textContent = pad(i + 1);
    cur = i;
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) set(items.indexOf(e.target)); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  items.forEach((it) => io.observe(it));
  segs.forEach((sg, k) => sg.addEventListener('click', () => items[k].scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })));
  set(0);
})();

/* Vibe page: the build in the middle of the screen plays in the "live build" window */
(() => {
  const show = document.querySelector('.vx-show');
  if (!show) return;
  const items = Array.from(show.querySelectorAll('.vx-item'));
  const segs = Array.from(show.querySelectorAll('.vx-seg'));
  const video = show.querySelector('.vx-video'), screen = show.querySelector('.vx-screen');
  const tab = show.querySelector('.vx-tab-name'), cmd = show.querySelector('.vx-cmd'), time = show.querySelector('.vx-time');
  const fill = show.querySelector('.vx-fill'), count = show.querySelector('.vx-count b');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = window.matchMedia('(min-width: 981px)');
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const mmss = (t) => { t = Math.max(0, Math.round(t || 0)); return Math.floor(t / 60) + ':' + pad(t % 60); };
  let cur = -1, userPaused = reduce, inView = false, typeT = null;

  const paint = () => {
    const d = video.duration || +(items[cur] && items[cur].dataset.dur) || 0;
    fill.style.transform = 'scaleX(' + (d ? Math.min(video.currentTime / d, 1) : 0) + ')';
    time.textContent = mmss(video.currentTime) + ' / ' + mmss(d);
  };
  const tryPlay = () => {
    if (userPaused || !inView || !desktop.matches) return;
    const pr = video.play(); if (pr && pr.catch) pr.catch(() => {});
  };
  const type = (text) => {
    clearInterval(typeT);
    if (reduce) { cmd.textContent = text; return; }
    let n = 0; cmd.textContent = '';
    typeT = setInterval(() => { cmd.textContent = text.slice(0, ++n); if (n >= text.length) clearInterval(typeT); }, 22);
  };
  const set = (i) => {
    if (i === cur || i < 0) return;
    cur = i;
    const it = items[i];
    items.forEach((x, k) => x.classList.toggle('is-on', k === i));
    segs.forEach((x, k) => x.classList.toggle('is-on', k === i));
    show.style.setProperty('--vx-acc', it.style.getPropertyValue('--acc'));
    tab.textContent = it.dataset.slug;
    count.textContent = pad(i + 1);
    type('ship ' + it.dataset.slug);
    video.poster = it.dataset.poster;
    video.setAttribute('aria-label', it.dataset.name + ' website screen recording');
    if (desktop.matches) {
      video.preload = 'auto';
      video.src = it.dataset.src;
      if (!userPaused && inView) show.classList.add('is-loading');
      tryPlay();
    }
    paint();
  };

  video.addEventListener('loadeddata', () => { show.classList.remove('is-loading'); paint(); });
  video.addEventListener('error', () => show.classList.remove('is-loading'));
  video.addEventListener('timeupdate', paint);
  video.addEventListener('play', () => show.classList.remove('is-paused'));
  video.addEventListener('pause', () => show.classList.add('is-paused'));
  video.addEventListener('ended', () => { if (cur < items.length - 1) items[cur + 1].scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); else { video.currentTime = 0; tryPlay(); } });
  screen.addEventListener('click', () => {
    if (video.paused) { userPaused = false; inView = true; if (!video.getAttribute('src')) { cur = -1; set(Math.max(0, items.findIndex((x) => x.classList.contains('is-on')))); } tryPlay(); }
    else { userPaused = true; video.pause(); }
  });

  const go = (k) => items[k].scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  segs.forEach((sg, k) => sg.addEventListener('click', () => { userPaused = false; go(k); }));
  items.forEach((it, k) => it.querySelector('.vx-card').addEventListener('click', (e) => {
    if (e.target.closest('a') || !desktop.matches) return;
    userPaused = false; go(k); if (k === cur) tryPlay();
  }));

  // which build is in the middle of the screen
  const mid = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) set(items.indexOf(e.target)); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  items.forEach((it) => mid.observe(it));

  // only play while the showcase is on screen
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView) tryPlay(); else video.pause();
  }, { threshold: 0.15 }).observe(show);

  // phones: each build plays inline when it is mostly in view
  const thumbIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (desktop.matches || reduce) return;
      if (e.isIntersecting) { if (!v.getAttribute('src')) v.src = v.dataset.src; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
      else v.pause();
    });
  }, { threshold: 0.6 });
  items.forEach((it) => { const v = it.querySelector('.vx-thumb video'); if (v) thumbIO.observe(v); });
  desktop.addEventListener && desktop.addEventListener('change', () => {
    items.forEach((it) => { const v = it.querySelector('.vx-thumb video'); if (v) v.pause(); });
    const k = cur; cur = -1; set(Math.max(0, k));
  });

  set(0);
})();

/* ===== Motion layer: word-by-word headlines, count-up numbers, magnetic buttons, parallax, tilt ===== */
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.documentElement.classList.add('motion');

  // 1. headlines: wrap every word so it can rise out of a mask when the heading scrolls in
  const heads = Array.from(document.querySelectorAll('main h2:not(.sx-title):not(.vx-title), .section-head h1, h1.vibe-title, .vibe-grid-title, .next-title'));
  heads.forEach((h) => {
    const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
    let i = 0;
    nodes.forEach((n) => {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const w = document.createElement('span'), inner = document.createElement('span');
        w.className = 'sw'; inner.className = 'sw-i';
        inner.textContent = part;
        inner.style.transitionDelay = (i++ * 0.065).toFixed(3) + 's';
        w.appendChild(inner); frag.appendChild(w);
      });
      n.parentNode.replaceChild(frag, n);
    });
    h.dataset.words = i;
    h.classList.add('split');
  });
  const splitIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const h = e.target;
    splitIO.unobserve(h);
    h.classList.add('split-in');
    setTimeout(() => h.classList.add('split-done'), (+h.dataset.words || 1) * 65 + 1150);
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  heads.forEach((h) => splitIO.observe(h));

  // 2. numbers count up from zero the first time they are seen (keeps prefixes, suffixes, zero-padding and m:ss)
  const countUp = (el) => {
    const m = el.textContent.trim().match(/^(\D*)(\d+)(?::(\d{2}))?(\D*)$/);
    if (!m) return;
    const isTime = m[3] !== undefined, width = m[2].length;
    const target = isTime ? (+m[2]) * 60 + (+m[3]) : +m[2];
    if (!target) return;
    const fmt = (v) => isTime ? String(Math.floor(v / 60)).padStart(width, '0') + ':' + String(v % 60).padStart(2, '0') : String(v).padStart(width, '0');
    const t0 = performance.now(), dur = 1500;
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = m[1] + fmt(Math.round(target * e)) + m[4];
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = m[1] + fmt(0) + m[4];
    requestAnimationFrame(step);
  };
  const countIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    countIO.unobserve(e.target);
    countUp(e.target);
  }), { threshold: 0.6 });
  document.querySelectorAll('.work-stat .num, .vibe-facts b, .pt-word sup, .hm-stat b, .st-count b').forEach((el) => countIO.observe(el));

  // 3. slow parallax drift on the big decorative numerals and words
  const drift = Array.from(document.querySelectorAll('.fx-num, .vibe-ghost, .footer-ghost')).map((el) => ({ el, k: el.classList.contains('fx-num') ? 0.14 : 0.1 }));
  const word = document.querySelector('.pt-word');
  const onScreen = new Set();
  const visIO = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target))), { rootMargin: '120px 0px' });
  drift.forEach((d) => visIO.observe(d.el));
  let ticking = false;
  const paint = () => {
    ticking = false;
    const vh = window.innerHeight;
    drift.forEach((d) => {
      if (!onScreen.has(d.el)) return;
      const r = d.el.parentElement.getBoundingClientRect();
      d.el.style.translate = '0 ' + ((r.top + r.height / 2 - vh / 2) * -d.k).toFixed(1) + 'px';
    });
    if (word && window.scrollY < vh * 1.2) word.style.translate = '0 ' + (window.scrollY * 0.18).toFixed(1) + 'px';
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
  paint();

  if (!fine) return;

  // 4. magnetic buttons: the main calls to action lean toward the cursor
  document.querySelectorAll('.btn-solid:not(.hm-btn), .nav-cta, .view-all, .sx-link, .vx-visit, .vc-visit, .next-arrow, .pi-go').forEach((el) => {
    const base = getComputedStyle(el).transition;
    el.style.transition = (base && !/^all 0s/.test(base) ? base + ', ' : '') + 'translate .4s cubic-bezier(.2,.7,.3,1)';
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.32;
      el.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
    });
    el.addEventListener('mouseleave', () => { el.style.translate = ''; });
  });

  // 5. the big showcase screens tilt slightly toward the cursor
  document.querySelectorAll('.sx-device, .vx-window').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = 'perspective(1400px) rotateX(' + (-py * 4).toFixed(2) + 'deg) rotateY(' + (px * 5).toFixed(2) + 'deg)';
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
})();

/* Stack: each tool card names its logo file in data-src (e.g. figma.svg, duda.png); swap it in once it has loaded,
   otherwise the generic icon stays */
(() => {
  document.querySelectorAll('.stack [data-src]').forEach((row) => {
    const im = new Image();
    im.onload = () => {
      im.alt = ''; im.width = 26; im.height = 26; im.decoding = 'async';
      row.querySelector('.st-ico').appendChild(im);
      row.classList.add('has-logo');
    };
    im.src = row.dataset.src;
  });
})();

/* Stack slider: one stage at a time. Slides sit on top of each other and swap with an animation (no scrolling,
   so a card can never stop half-way). Advances on its own every few seconds; dots, arrows, buttons, keys and swipe jump. */
(() => {
  const slider = document.querySelector('.st-slider');
  if (!slider) return;
  const box = slider.querySelector('.st-slides');
  const slides = Array.from(box.querySelectorAll('.st-slide'));
  const dots = Array.from(slider.querySelectorAll('.st-dot'));
  const cur = slider.querySelector('.st-cur');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const n = slides.length;
  let idx = 0, inView = false;
  const outT = new Map();
  const pad = (v) => (v < 10 ? '0' : '') + v;
  const fit = () => { box.style.height = slides[idx].offsetHeight + 'px'; };
  const restartFill = () => dots.forEach((d) => { const f = d.querySelector('i'); f.style.animation = 'none'; void f.offsetWidth; f.style.animation = ''; });
  const paint = () => {
    dots.forEach((d, k) => { d.classList.toggle('is-on', k === idx); if (k === idx) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    slides.forEach((s, k) => s.setAttribute('aria-hidden', k === idx ? 'false' : 'true'));
    restartFill();
    if (cur) cur.innerHTML = '<b>' + pad(idx + 1) + '</b> ' + slides[idx].querySelector('h3').textContent;
  };
  const go = (i, dir) => {
    i = (i + n) % n;
    if (i === idx) { restartFill(); return; }
    if (!dir) dir = (i > idx || (idx === n - 1 && i === 0)) ? 1 : -1;
    slider.classList.toggle('back', dir < 0);
    const prev = slides[idx];
    prev.classList.remove('is-active');
    if (!reduce) {
      prev.classList.add('is-out');
      clearTimeout(outT.get(prev));
      outT.set(prev, setTimeout(() => prev.classList.remove('is-out'), 650));
    }
    idx = i;
    const next = slides[idx];
    next.classList.remove('is-out');
    next.classList.add('is-active');
    paint(); fit();
  };
  slider.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(+b.dataset.go)));
  slider.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => go(idx + +b.dataset.step, +b.dataset.step)));
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1, 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1, -1); }
  });
  // swipe (touch / pen / mouse drag)
  let sx = 0, sy = 0, down = false;
  box.addEventListener('pointerdown', (e) => { down = true; sx = e.clientX; sy = e.clientY; });
  box.addEventListener('pointerup', (e) => {
    if (!down) return; down = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) go(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
  box.addEventListener('pointercancel', () => { down = false; });
  // keep the frame as tall as the current slide
  if (window.ResizeObserver) { const ro = new ResizeObserver(fit); slides.forEach((s) => ro.observe(s)); }
  window.addEventListener('resize', fit);
  // first time it scrolls into view: play the entrance; autoplay only while on screen and the tab is visible
  const sync = () => slider.classList.toggle('paused', !inView || document.hidden);
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView && !slider.classList.contains('st-live')) {
      slider.classList.add('st-live');
      const s = slides[idx]; s.classList.remove('is-active'); void s.offsetWidth; s.classList.add('is-active');
      restartFill();
    }
    sync();
  }, { threshold: 0.25 }).observe(slider);
  document.addEventListener('visibilitychange', sync);
  if (!reduce) {
    slider.classList.add('autoplay');
    dots.forEach((d, k) => d.querySelector('i').addEventListener('animationend', () => { if (k === idx) go(idx + 1, 1); }));
  }
  paint(); fit(); sync();
})();

/* Stack tabs: "All tools" shows every stage; a stage tab focuses the board on that stage.
   A dark thumb slides behind the active tab; the board fades out, swaps, and its cards rise back in */
(() => {
  const tabsEl = document.querySelector('.sg-tabs'), board = document.getElementById('sgBoard');
  if (!tabsEl || !board) return;
  const tabs = Array.from(tabsEl.querySelectorAll('.sg-tab'));
  const thumb = tabsEl.querySelector('.sg-thumb');
  const cols = Array.from(board.querySelectorAll('.sg-col'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let view = (tabs.find((t) => t.classList.contains('is-on')) || tabs[0]).dataset.view, swapT = 0;
  tabs.forEach((t) => t.setAttribute('aria-controls', 'sgBoard'));
  const moveThumb = (instant) => {
    const on = tabs.find((t) => t.classList.contains('is-on'));
    if (!on) return;
    if (instant) thumb.style.transition = 'none';
    thumb.style.width = on.offsetWidth + 'px';
    thumb.style.transform = 'translateX(' + on.offsetLeft + 'px)';
    if (instant) { void thumb.offsetWidth; thumb.style.transition = ''; }
  };
  const apply = (v) => {
    board.classList.toggle('is-focus', v !== 'all');
    cols.forEach((c, k) => c.classList.toggle('is-picked', String(k) === v));
    board.classList.remove('pop'); void board.offsetWidth; board.classList.add('pop');
  };
  const pick = (t) => {
    const v = t.dataset.view;
    tabs.forEach((x) => { const on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; });
    moveThumb(false);
    if (t.scrollIntoView && window.innerWidth <= 700) t.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    if (v === view) return;
    view = v;
    if (reduce) { apply(v); return; }
    clearTimeout(swapT);
    board.classList.add('swapping');
    swapT = setTimeout(() => { apply(v); board.classList.remove('swapping'); }, 230);
  };
  tabs.forEach((t, k) => {
    t.tabIndex = t.classList.contains('is-on') ? 0 : -1;
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault(); const n = tabs[(k + d + tabs.length) % tabs.length]; pick(n); n.focus();
    });
  });
  moveThumb(true);
  window.addEventListener('resize', () => moveThumb(true));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveThumb(true));
  window.addEventListener('load', () => moveThumb(true));
})();

