/* EISHIKI v3 — behaviour
   tooltips · section nav scrollspy · four-state explorer · before/after
   with rule attribution · circle of influence · button spark */
(function () {
  'use strict';

  /* ================================================================
     TOOLTIPS
     ================================================================ */
  var tip = document.createElement('div');
  tip.className = 'tip';
  tip.setAttribute('role', 'tooltip');
  tip.id = 'ds-tip';
  document.body.appendChild(tip);
  var activeTerm = null;

  function hideTip() {
    tip.classList.remove('on', 'flip');
    if (activeTerm) {
      activeTerm.removeAttribute('aria-describedby');
      activeTerm.setAttribute('aria-expanded', 'false');
      activeTerm = null;
    }
  }
  function showTip(el) {
    if (!el.dataset.tip) return;
    activeTerm = el;
    tip.innerHTML = (el.dataset.tipLabel ? '<i>' + el.dataset.tipLabel + '</i>' : '') + el.dataset.tip;
    tip.classList.add('on');
    el.setAttribute('aria-describedby', 'ds-tip');
    el.setAttribute('aria-expanded', 'true');
    tip.style.left = '0px'; tip.style.top = '0px';
    var r = el.getBoundingClientRect(), t = tip.getBoundingClientRect();
    var sx = window.scrollX, sy = window.scrollY, pad = 12;
    var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    var left = Math.max(sx + pad, Math.min(r.left + sx + r.width / 2 - t.width / 2, sx + vw - t.width - pad));
    var fitsBelow = (r.bottom + t.height + 9) < vh;
    if (!fitsBelow) tip.classList.add('flip');
    tip.style.left = left + 'px';
    tip.style.top = (fitsBelow ? r.bottom + sy + 9 : r.top + sy - t.height - 9) + 'px';
    tip.style.setProperty('--tx', Math.max(10, Math.min(r.left + sx + r.width / 2 - left, t.width - 10)) + 'px');
  }
  document.querySelectorAll('.term').forEach(function (el) {
    el.setAttribute('aria-expanded', 'false');
    el.addEventListener('mouseenter', function () { showTip(el); });
    el.addEventListener('mouseleave', function () { if (activeTerm === el) hideTip(); });
    el.addEventListener('focus', function () { showTip(el); });
    el.addEventListener('blur', function () { if (activeTerm === el) hideTip(); });
    el.addEventListener('click', function (e) { e.preventDefault(); activeTerm === el ? hideTip() : showTip(el); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideTip(); });
  window.addEventListener('scroll', function () { if (activeTerm) hideTip(); }, { passive: true });
  window.addEventListener('resize', hideTip);

  /* ================================================================
     SECTION NAV — scrollspy
     ================================================================ */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.snav a'));
  var targets = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if (targets.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    targets.forEach(function (t) { spy.observe(t); });
  }

  /* ================================================================
     FOUR-STATE EXPLORER
     ================================================================ */
  document.querySelectorAll('[data-states]').forEach(function (wrap) {
    var btns = Array.prototype.slice.call(wrap.querySelectorAll('.state'));
    var out = wrap.querySelector('.state-out');
    if (!out) return;
    var txt = out.querySelector('.txt'), tok = out.querySelector('.tok');
    function pick(b) {
      btns.forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
      b.classList.add('on'); b.setAttribute('aria-selected', 'true');
      txt.innerHTML = b.dataset.rule;
      tok.textContent = b.dataset.token;
      tok.style.color = b.dataset.tone === 'ok' ? 'var(--data-ok)'
        : b.dataset.tone === 'dash' ? 'var(--text-faint)' : 'var(--text-primary)';
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('focus', function () { pick(b); });
    });
    pick(btns[0]);
  });

  /* ================================================================
     BEFORE / AFTER — values, tones, and the rule that fired
     ================================================================ */
  document.querySelectorAll('[data-demo]').forEach(function (demo) {
    var before = demo.querySelector('[data-before]');
    var after = demo.querySelector('[data-after]');
    function render(isAfter) {
      demo.querySelectorAll('.df').forEach(function (f) {
        var v = f.querySelector('.val');
        var fired = f.querySelector('.fired');
        f.classList.remove('is-null', 'is-ok', 'is-dash', 'dashed', 'show-rule');
        if (isAfter) {
          v.textContent = f.dataset.a;
          if (f.dataset.at) f.classList.add('is-' + f.dataset.at);
          if (f.dataset.at === 'dash') f.classList.add('dashed');
          if (fired) { fired.innerHTML = '<b>▸</b> ' + f.dataset.rule; f.classList.add('show-rule'); }
        } else {
          v.textContent = f.dataset.b;
          f.classList.add('is-null');
        }
      });
      if (before) { before.classList.toggle('active', !isAfter); before.setAttribute('aria-pressed', String(!isAfter)); }
      if (after) { after.classList.toggle('active', isAfter); after.setAttribute('aria-pressed', String(isAfter)); }
      var lg = demo.parentElement.querySelector('.legend');
      if (lg) lg.dataset.side = isAfter ? 'after' : 'before';
    }
    if (before) before.addEventListener('click', function () { render(false); });
    if (after) after.addEventListener('click', function () { render(true); });
    render(false);
  });

  /* ================================================================
     CIRCLE OF INFLUENCE
     ================================================================ */
  document.querySelectorAll('[data-coi]').forEach(function (coi) {
    var stage = coi.querySelector('.stage2');
    var edges = coi.querySelector('svg.edges');
    var desc = coi.querySelector('.desc');
    var btns = Array.prototype.slice.call(coi.querySelectorAll('.chip'));
    var NS = 'http://www.w3.org/2000/svg';
    if (!stage || !edges) return;

    function layout() {
      edges.innerHTML = '';
      stage.querySelectorAll('.sat').forEach(function (s) { s.remove(); });
      var w = stage.clientWidth, h = stage.clientHeight, cx = w / 2, cy = h / 2, n = btns.length;
      btns.forEach(function (b, i) {
        var ang = (-Math.PI / 2) + (i / n) * Math.PI * 2;
        var x = cx + Math.cos(ang) * w * 0.40, y = cy + Math.sin(ang) * h * 0.34;
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', 'M' + cx + ',' + cy + ' C' + ((cx + x) / 2) + ',' + cy + ' ' + ((cx + x) / 2) + ',' + y + ' ' + x + ',' + y);
        p.setAttribute('class', 'edge'); p.id = coi.id + '-e' + i;
        edges.appendChild(p);
        var s = document.createElement('div');
        s.className = 'sat'; s.id = coi.id + '-s' + i;
        s.style.left = x + 'px'; s.style.top = y + 'px';
        stage.appendChild(s);
      });
    }
    function activate(b, i) {
      btns.forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      coi.querySelectorAll('.edge,.sat').forEach(function (e) { e.classList.remove('lit'); });
      var e = document.getElementById(coi.id + '-e' + i), s = document.getElementById(coi.id + '-s' + i);
      if (e) e.classList.add('lit');
      if (s) s.classList.add('lit');
      if (desc) { desc.textContent = b.dataset.d; desc.classList.add('show'); }
    }
    btns.forEach(function (b, i) {
      b.addEventListener('mouseenter', function () { activate(b, i); });
      b.addEventListener('focus', function () { activate(b, i); });
      b.addEventListener('click', function () { activate(b, i); });
    });
    stage.addEventListener('mouseleave', function () { if (desc) desc.classList.remove('show'); });
    setTimeout(layout, 220);
    window.addEventListener('resize', layout);
  });

  /* ================================================================
     BUTTON SPARK — nine squares, upward fan. Primary actions only.
     ================================================================ */
  document.querySelectorAll('.btn button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
      var host = b.parentElement, n = 9;
      for (var i = 0; i < n; i++) {
        var a = (-Math.PI / 2) + (i - (n - 1) / 2) * 0.26 + (Math.random() - 0.5) * 0.16;
        var d = 34 + Math.random() * 46;
        var sz = 3 + Math.round(Math.random() * 3);
        var s = document.createElement('span');
        s.className = 'spark';
        s.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;left:50%;top:50%;--tx:' +
          (Math.cos(a) * d) + 'px;--ty:' + (Math.sin(a) * d) + 'px';
        host.appendChild(s);
        setTimeout(function (el) { return function () { el.remove(); }; }(s), 640);
      }
    });
  });

})();
