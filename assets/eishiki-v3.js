/* EISHIKI v3 — behaviour
   tooltips · section nav scrollspy · four-state explorer · before/after
   with rule attribution · system-of-influence maps · button spark */
(function () {
  'use strict';

  /* Motion values are declared once in eishiki-v3.css and read here, so a
     retune is a stylesheet edit and never a JavaScript edit. */
  function ms(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    var n = parseFloat(v);
    return isNaN(n) ? fallback : (v.indexOf('ms') > -1 ? n : n * 1000);
  }
  var REDUCED = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

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
     SCROLLBAR WIDTH — published as --sbw for the bleed maths.
     100vw includes the classic scrollbar on Windows, so anything that
     bleeds to "the viewport edge" using it overshoots by ~15px, and
     html{overflow-x:clip} then eats whatever was in those pixels —
     silently, which is the worst kind. Measured here instead.
     ================================================================ */
  var setSBW = function () {
    var w = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--sbw', (w > 0 ? w : 0) + 'px');
  };
  setSBW();
  window.addEventListener('resize', setSBW, { passive: true });

  /* ================================================================
     THE CRUMB — position readout in the chrome.
     Replaces the sticky left rail and the evidence bookmark. It reports
     where the reader is, how long the document is, and opens to a jump
     list. Everything it needs is read off the markup, so a page adds a
     section by adding a section — nothing here is a second list to
     maintain alongside the first.
     ================================================================ */
  var crumb = document.querySelector('.crumb');
  if (crumb) {
    var trig = crumb.querySelector('.crumb-t');
    var list = crumb.querySelector('.crumb-l');
    var links = Array.prototype.slice.call(crumb.querySelectorAll('.crumb-l a'));
    var slotN = crumb.querySelector('.crumb-t .n');
    var slotT = crumb.querySelector('.crumb-t .t');
    var total = links.length;

    function mark(i) {
      links.forEach(function (a, k) { a.classList.toggle('on', k === i); });
      if (slotN) slotN.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
      if (slotT) slotT.textContent = links[i].dataset.t || links[i].textContent.trim();
    }

    function open(yes) {
      if (!list || !trig) return;
      list.hidden = !yes;
      trig.setAttribute('aria-expanded', String(yes));
    }
    if (trig) trig.addEventListener('click', function () {
      open(list.hidden);
    });
    /* close on escape, on choosing, and on anything outside */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && list && !list.hidden) { open(false); trig.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (list && !list.hidden && !crumb.contains(e.target)) open(false);
    });
    links.forEach(function (a) { a.addEventListener('click', function () { open(false); }); });

    var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    if (total && 'IntersectionObserver' in window) {
      mark(0);
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var i = secs.indexOf(en.target);
          if (i > -1) mark(i);
        });
      }, { rootMargin: '-25% 0px -65% 0px' });
      secs.forEach(function (t) { if (t) spy.observe(t); });
    }
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
    /* Activation on focus meant a keyboard user changed the displayed
       state four times just tabbing past the group. Selection now follows
       arrow keys and click, which is what role="tab" already promised. */
    btns.forEach(function (b, i) {
      b.tabIndex = i === 0 ? 0 : -1;
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
              : e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var next = btns[(i + d + btns.length) % btns.length];
        btns.forEach(function (x) { x.tabIndex = -1; });
        next.tabIndex = 0; next.focus(); pick(next);
      });
    });
    pick(btns[0]);
  });

  /* ================================================================
     BEFORE / AFTER — values, tones, and the rule that fired
     ================================================================ */
  document.querySelectorAll('[data-demo]').forEach(function (demo) {
    var before = demo.querySelector('[data-before]');
    var after = demo.querySelector('[data-after]');
    var GAP = ms('--gap-cause', 120), STAGGER = ms('--stagger-row', 90);

    function render(isAfter) {
      demo.querySelectorAll('.df').forEach(function (f, i) {
        var delay = REDUCED ? 0 : i * STAGGER;
        setTimeout(function () {
          var v = f.querySelector('.val');
          var fired = f.querySelector('.fired');
          f.classList.remove('is-null', 'is-ok', 'is-dash', 'dashed', 'show-rule', 'cellflash');
          if (!isAfter) {
            v.textContent = f.dataset.b;
            f.classList.add('is-null');
            return;
          }
          /* the cell flashes first — that is the rule firing — and only
             then does the attribution write in underneath it */
          if (!REDUCED) { void f.offsetWidth; f.classList.add('cellflash'); }
          setTimeout(function () {
            v.textContent = f.dataset.a;
            if (f.dataset.at) f.classList.add('is-' + f.dataset.at);
            if (f.dataset.at === 'dash') f.classList.add('dashed');
            if (fired) { fired.innerHTML = '<b>▸</b> ' + f.dataset.rule; f.classList.add('show-rule'); }
          }, REDUCED ? 0 : GAP);
        }, delay);
      });
      if (before) { before.classList.toggle('active', !isAfter); before.setAttribute('aria-pressed', String(!isAfter)); }
      if (after) { after.classList.toggle('active', isAfter); after.setAttribute('aria-pressed', String(isAfter)); }
      var lg = demo.parentElement.querySelector('.legend');
      if (lg) lg.dataset.side = isAfter ? 'after' : 'before';
    }
    if (before) before.addEventListener('click', function () { render(false); });
    if (after) after.addEventListener('click', function () { render(true); });

    /* The live band's primary control. It sits outside .demo — on the band
       header, where a reader who skipped the prose still meets it — so it is
       bound here rather than found by the scoped query above. It drives the
       same render() as the inline toggle and relabels itself, so the two
       controls can never disagree about which state the specimen is in. */
    var band = demo.closest('.live');
    var go = band && band.querySelector('[data-live-go]');
    if (go) {
      var isAfter = false;
      var goIcon = go.querySelector('.ph');
      var goLabel = go.querySelector('[data-live-label]');
      var busyTimer = 0;
      var rowCount = demo.querySelectorAll('.df').length;
      var workDuration = REDUCED ? 0
        : Math.max(ms('--dur-flash', 220), Math.max(0, rowCount - 1) * STAGGER + GAP + ms('--dur-flash', 220));
      function markWorking() {
        clearTimeout(busyTimer);
        go.setAttribute('aria-busy', 'true');
        busyTimer = setTimeout(function () { go.removeAttribute('aria-busy'); }, workDuration);
      }
      function syncGo(afterState) {
        if (goIcon) goIcon.className = afterState
          ? 'ph ph-arrow-left icon-action'
          : 'ph ph-arrow-right icon-action';
        if (goLabel) goLabel.textContent = afterState ? 'Back to before' : 'Apply the rule';
      }
      go.addEventListener('click', function () {
        markWorking();
        isAfter = !isAfter;
        render(isAfter);
        syncGo(isAfter);
      });
      /* keep the band control honest when the inline toggle is used */
      if (before) before.addEventListener('click', function () {
        isAfter = false; syncGo(false);
      });
      if (after) after.addEventListener('click', function () {
        isAfter = true; syncGo(true);
      });
    }
    render(false);
  });

  /* ================================================================
     SHARED INFLUENCE MAP
     Committed geometry: 360px stage · 80% spread · 34% curvature.
     ================================================================ */
  document.querySelectorAll('[data-influence]').forEach(function (map) {
    var stage = map.querySelector('.influence-stage');
    var edges = map.querySelector('.influence-edges');
    var nodes = Array.prototype.slice.call(map.querySelectorAll('.influence-node'));
    var kind = map.querySelector('.influence-kind');
    var title = map.querySelector('.influence-title');
    var copy = map.querySelector('.influence-copy');
    var NS = 'http://www.w3.org/2000/svg';
    var SPREAD = 0.80, CURVE = 0.34;
    var selected = Math.max(0, nodes.findIndex(function (node) {
      return node.getAttribute('aria-pressed') === 'true';
    }));
    if (!stage || !edges || !nodes.length) return;

    function updateDetail(node) {
      if (kind) kind.textContent = node.dataset.kind || 'Influence';
      if (title) title.textContent = node.textContent.trim() + ' · ' + (node.dataset.facet || 'Contribution');
      if (copy) copy.textContent = node.dataset.copy || '';
    }

    function edgePath(cx, cy, x, y) {
      var dx = x - cx, dy = y - cy;
      var c1x = cx + dx * (0.28 + CURVE * 0.16);
      var c1y = cy + dy * (0.06 + CURVE * 0.08);
      var c2x = x - dx * (0.12 + CURVE * 0.18);
      var c2y = y - dy * (0.28 + CURVE * 0.12);
      return 'M' + cx + ',' + cy + ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + x + ',' + y;
    }

    function layout(animateSelected) {
      map.classList.add('is-ready');
      var compact = stage.clientWidth < 680;
      map.classList.toggle('is-compact', compact);
      edges.innerHTML = '';

      if (compact) {
        nodes.forEach(function (node) {
          node.style.left = '';
          node.style.top = '';
        });
        return;
      }

      var w = stage.clientWidth, h = stage.clientHeight;
      var cx = w / 2, cy = h / 2, n = nodes.length;
      var rx = Math.max(96, (w / 2 - 112) * SPREAD);
      var ry = Math.max(76, (h / 2 - 48) * SPREAD);

      nodes.forEach(function (node, index) {
        var angle = (-Math.PI / 2) + (index / n) * Math.PI * 2;
        var x = cx + Math.cos(angle) * rx;
        var y = cy + Math.sin(angle) * ry;
        node.style.left = x + 'px';
        node.style.top = y + 'px';

        var path = document.createElementNS(NS, 'path');
        path.setAttribute('class', 'influence-edge' + (index === selected ? ' is-active' : ''));
        path.setAttribute('d', edgePath(cx, cy, x, y));
        edges.appendChild(path);

        if (index === selected && animateSelected && !REDUCED) {
          var length = path.getTotalLength();
          path.style.strokeDasharray = length;
          path.style.strokeDashoffset = length;
          requestAnimationFrame(function () { path.style.strokeDashoffset = 0; });
        }
      });
    }

    function activate(index, animate) {
      if (index < 0 || index >= nodes.length) return;
      selected = index;
      nodes.forEach(function (node, nodeIndex) {
        node.setAttribute('aria-pressed', nodeIndex === selected ? 'true' : 'false');
      });
      updateDetail(nodes[selected]);
      layout(animate);
    }

    nodes.forEach(function (node, index) {
      node.setAttribute('aria-label', node.textContent.trim() + ': ' + (node.dataset.facet || 'Contribution'));
      node.addEventListener('mouseenter', function () { if (selected !== index) activate(index, true); });
      node.addEventListener('focus', function () { if (selected !== index) activate(index, true); });
      node.addEventListener('click', function () { activate(index, true); });
    });

    updateDetail(nodes[selected]);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(false); });
    else layout(false);

    if ('ResizeObserver' in window) {
      var observer = new ResizeObserver(function () { layout(false); });
      observer.observe(stage);
    } else window.addEventListener('resize', function () { layout(false); });
  });

  /* ================================================================
     BUTTON SPARK — nine squares, upward fan. Primary actions only.
     ================================================================ */
  document.querySelectorAll('.btn button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
      var host = b.parentElement, n = 12;
      for (var i = 0; i < n; i++) {
        var a = (-Math.PI / 2) + (i - (n - 1) / 2) * 0.39 + (Math.random() - 0.5) * 0.16;
        var d = 59 + Math.random() * 50;   /* 84px mean throw */
        var sz = 3 + Math.round(Math.random() * 3);
        var s = document.createElement('span');
        s.className = 'spark';
        s.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;left:50%;top:50%;--tx:' +
          (Math.cos(a) * d) + 'px;--ty:' + (Math.sin(a) * d) + 'px';
        host.appendChild(s);
        setTimeout(function (el) { return function () { el.remove(); }; }(s), 700);
      }
    });
  });

})();
