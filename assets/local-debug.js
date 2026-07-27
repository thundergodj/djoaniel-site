(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var hostname = window.location.hostname;
  var LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
  var isPrivateHost =
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /\.local$/i.test(hostname);
  var isExplicit = params.get('debug') === '1';

  if (LOCAL_HOSTS.indexOf(hostname) === -1 && !isPrivateHost && !isExplicit) return;

  var ACCENTS = [
    { id:'original',  label:'Original',  hex:'#0B3FFF', css:'rgb(11,63,255)', rgb:'11,63,255' },
    { id:'trust',     label:'Trust',     hex:'#0057B8', css:'rgb(0,87,184)',  rgb:'0,87,184' },
    { id:'authority', label:'Authority', hex:'#174A8B', css:'rgb(23,74,139)', rgb:'23,74,139' },
    { id:'clarity',   label:'Clarity',   hex:'#006B9E', css:'rgb(0,107,158)', rgb:'0,107,158' }
  ];
  var OVERLAYS = [
    { id:'grid',     label:'Grid / gutter',       note:'8 / 24 px' },
    { id:'layout',   label:'Layout outlines',     note:'visible boxes' },
    { id:'overflow', label:'Overflow containers', note:'scroll / clip' },
    { id:'focus',    label:'Focus order',         note:'keyboard stops' },
    { id:'targets',  label:'Target boxes',        note:'24 px floor' },
    { id:'tones',    label:'Colour heatmap',      note:'accent / data' }
  ];
  var ACCENT_KEY = 'djoaniel.debug.accent';
  var OVERLAY_KEY = 'djoaniel.debug.overlays';
  var root = document.documentElement;
  var overlayState = {};
  var colourCache = {};
  var refreshQueued = false;
  var copyTimer = 0;

  function findAccent(id) {
    for (var i = 0; i < ACCENTS.length; i++) {
      if (ACCENTS[i].id === id) return ACCENTS[i];
    }
    return ACCENTS[0];
  }

  function readStored(key, fallback) {
    try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
  }

  function writeStored(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  function removeStored(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  var storedAccent = readStored(ACCENT_KEY, 'original');
  if (storedAccent === 'signal') storedAccent = 'original';
  var current = findAccent(params.get('dbgAccent') || storedAccent);

  function readOverlayState() {
    var requested = params.get('dbg');
    var stored = readStored(OVERLAY_KEY, '');
    var ids = (requested !== null ? requested : stored).split(',').filter(Boolean);
    OVERLAYS.forEach(function (item) {
      overlayState[item.id] = ids.indexOf(item.id) !== -1;
    });
  }

  readOverlayState();

  function enabledOverlayIds() {
    return OVERLAYS.filter(function (item) {
      return overlayState[item.id];
    }).map(function (item) {
      return item.id;
    });
  }

  function persistOverlayState() {
    var ids = enabledOverlayIds();
    if (ids.length) writeStored(OVERLAY_KEY, ids.join(','));
    else removeStored(OVERLAY_KEY);
  }

  function applyAccent(accent, persist) {
    current = accent;
    root.style.setProperty('--accent', accent.css);
    root.style.setProperty('--accent-blue', accent.css);
    root.style.setProperty('--accent-rgb', accent.rgb);
    root.setAttribute('data-debug-accent', accent.id);
    colourCache = {};

    if (persist) writeStored(ACCENT_KEY, accent.id);

    document.querySelectorAll('.debug-accent input[name="debug-accent"]').forEach(function (input) {
      input.checked = input.value === accent.id;
    });

    updateContrast();
    updatePanelState();
    if (overlayState.tones) scheduleRefresh();
  }

  applyAccent(current, false);

  var ownScript = document.currentScript;
  if (ownScript && ownScript.getAttribute('data-ui') === 'off') return;

  var overlayControls = OVERLAYS.map(function (item) {
    return '<label class="debug-switch">' +
      '<input type="checkbox" value="' + item.id + '"' + (overlayState[item.id] ? ' checked' : '') + '>' +
      '<span><b>' + item.label + '</b><small>' + item.note + '</small></span>' +
      '<output data-debug-count="' + item.id + '">—</output>' +
    '</label>';
  }).join('');

  var accentOptions = ACCENTS.map(function (accent) {
    return '<label class="debug-accent-option">' +
      '<input type="radio" name="debug-accent" value="' + accent.id + '"' + (accent.id === current.id ? ' checked' : '') + '>' +
      '<span class="debug-chip" style="background:' + accent.hex + '" aria-hidden="true"></span>' +
      '<span class="debug-option"><b>' + accent.label + '</b>' +
      '<code>' + accent.hex + ' · <output data-accent-ratio="' + accent.id + '">—</output></code></span>' +
    '</label>';
  }).join('');

  document.body.insertAdjacentHTML('beforeend',
    '<details class="debug-accent">' +
      '<summary aria-label="Local debug">' +
        '<span>Local debug</span>' +
        '<span class="debug-summary-state" data-debug-summary></span>' +
        '<span class="debug-live-swatch" aria-hidden="true"></span>' +
      '</summary>' +
      '<div class="debug-panel-body">' +
        '<section class="debug-section">' +
          '<h2>Visual overlays</h2>' +
          '<div class="debug-switches">' + overlayControls + '</div>' +
          '<div class="debug-tone-key" aria-hidden="true">' +
            '<span><i class="accent"></i>Selected</span>' +
            '<span><i class="operator"></i>Operator</span>' +
            '<span><i class="null"></i>Null</span>' +
            '<span><i class="ok"></i>Resolved</span>' +
          '</div>' +
        '</section>' +
        '<section class="debug-section">' +
          '<fieldset class="debug-accent-fieldset">' +
            '<legend>Accent · live contrast</legend>' +
            accentOptions +
          '</fieldset>' +
          '<div class="debug-contrast">' +
            '<div><span>Accent / Paper</span><code data-contrast="paper">—</code></div>' +
            '<div><span>Accent / White</span><code data-contrast="white">—</code></div>' +
            '<div><span>White / Accent</span><code data-contrast="inverse">—</code></div>' +
            '<div><span>Focus ring / Paper</span><code data-contrast="focus">—</code></div>' +
          '</div>' +
        '</section>' +
        '<section class="debug-section debug-session">' +
          '<h2>Reproduce</h2>' +
          '<p data-debug-saved></p>' +
          '<div class="debug-actions">' +
            '<button type="button" data-debug-action="report">Copy report</button>' +
            '<button type="button" data-debug-action="url">Copy debug URL</button>' +
            '<button type="button" data-debug-action="reset">Reset all</button>' +
          '</div>' +
          '<p class="debug-copy-status" role="status" aria-live="polite" data-debug-copy-status></p>' +
        '</section>' +
      '</div>' +
    '</details>' +
    '<div class="debug-overlay-layer" aria-hidden="true">' +
      '<div class="debug-overlay-markers"></div>' +
    '</div>'
  );

  var panel = document.querySelector('.debug-accent');
  var overlayLayer = document.querySelector('.debug-overlay-layer');
  var markerLayer = document.querySelector('.debug-overlay-markers');

  function createColourContext() {
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.getContext('2d', { willReadFrequently:true });
  }

  var colourContext = createColourContext();

  function colourToRgb(value) {
    if (!value || !colourContext) return null;
    if (colourCache[value]) return colourCache[value].slice();

    colourContext.clearRect(0, 0, 1, 1);
    colourContext.fillStyle = 'rgba(0,0,0,0)';
    try { colourContext.fillStyle = value; } catch (e) { return null; }
    colourContext.fillRect(0, 0, 1, 1);
    var data = colourContext.getImageData(0, 0, 1, 1).data;
    if (!data[3]) return null;

    var rgb = [data[0], data[1], data[2]];
    colourCache[value] = rgb;
    return rgb.slice();
  }

  function tokenRgb(name) {
    var probe = document.createElement('span');
    probe.className = 'debug-colour-probe';
    probe.style.color = 'var(' + name + ')';
    document.body.appendChild(probe);
    var value = getComputedStyle(probe).color;
    probe.remove();
    return colourToRgb(value);
  }

  function channel(value) {
    value /= 255;
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  }

  function luminance(rgb) {
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  }

  function contrastRatio(a, b) {
    if (!a || !b) return 0;
    var x = luminance(a);
    var y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }

  function ratioLabel(ratio, threshold) {
    return ratio.toFixed(2) + ':1 · ' + (ratio >= threshold ? 'Pass' : 'Fail');
  }

  function setText(selector, value) {
    var el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function contrastValues(accent) {
    var accentRgb = colourToRgb(accent.css);
    var paper = tokenRgb('--paper') || [247, 246, 242];
    var white = tokenRgb('--white') || [255, 255, 255];
    return {
      paper:contrastRatio(accentRgb, paper),
      white:contrastRatio(accentRgb, white)
    };
  }

  function updateContrast() {
    if (!document.body || !document.querySelector('.debug-accent')) return;

    ACCENTS.forEach(function (accent) {
      var values = contrastValues(accent);
      setText('[data-accent-ratio="' + accent.id + '"]', values.paper.toFixed(2) + ':1');
    });

    var active = contrastValues(current);
    setText('[data-contrast="paper"]', ratioLabel(active.paper, 4.5));
    setText('[data-contrast="white"]', ratioLabel(active.white, 4.5));
    setText('[data-contrast="inverse"]', ratioLabel(active.white, 4.5));
    setText('[data-contrast="focus"]', ratioLabel(active.paper, 3));
  }

  function isDebugElement(element) {
    return !!element.closest('.debug-accent,.debug-overlay-layer');
  }

  function isVisible(element) {
    var style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    var rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function allPageElements() {
    return Array.prototype.slice.call(document.body.querySelectorAll('*')).filter(function (element) {
      return !isDebugElement(element) && isVisible(element);
    });
  }

  function focusableElements() {
    var selector = 'a[href],button,input,select,textarea,summary,[tabindex],[contenteditable="true"]';
    return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (element) {
      if (isDebugElement(element) || !isVisible(element) || element.disabled) return false;
      var tabindex = element.getAttribute('tabindex');
      return tabindex === null || parseInt(tabindex, 10) >= 0;
    });
  }

  function clearDebugMarks() {
    document.querySelectorAll(
      '.debug-layout-target,.debug-overflow-x,.debug-overflow-y,[data-debug-tone]'
    ).forEach(function (element) {
      element.classList.remove('debug-layout-target', 'debug-overflow-x', 'debug-overflow-y');
      element.removeAttribute('data-debug-tone');
    });
    markerLayer.innerHTML = '';
  }

  function updateCount(id, value) {
    setText('[data-debug-count="' + id + '"]', value);
  }

  function renderLayout(elements) {
    if (!overlayState.layout) {
      updateCount('layout', '—');
      return;
    }
    elements.forEach(function (element) {
      element.classList.add('debug-layout-target');
    });
    updateCount('layout', String(elements.length));
  }

  function findOverflow(elements) {
    return elements.filter(function (element) {
      return element.scrollWidth > element.clientWidth + 1 ||
        element.scrollHeight > element.clientHeight + 1;
    });
  }

  function renderOverflow(elements) {
    var overflow = findOverflow(elements);
    if (!overlayState.overflow) {
      updateCount('overflow', String(overflow.length));
      return overflow;
    }

    overflow.forEach(function (element) {
      if (element.scrollWidth > element.clientWidth + 1) element.classList.add('debug-overflow-x');
      if (element.scrollHeight > element.clientHeight + 1) element.classList.add('debug-overflow-y');
    });
    updateCount('overflow', String(overflow.length));
    return overflow;
  }

  function sameRgb(a, b) {
    return a && b && Math.abs(a[0] - b[0]) < 2 &&
      Math.abs(a[1] - b[1]) < 2 && Math.abs(a[2] - b[2]) < 2;
  }

  function elementTones(element, tones) {
    var style = getComputedStyle(element);
    var properties = [
      style.color, style.backgroundColor, style.borderTopColor, style.borderRightColor,
      style.borderBottomColor, style.borderLeftColor, style.outlineColor, style.fill, style.stroke
    ];
    var found = [];

    tones.forEach(function (tone) {
      var matches = properties.some(function (value) {
        return sameRgb(colourToRgb(value), tone.rgb);
      });
      if (matches) found.push(tone.id);
    });
    return found;
  }

  function renderTones(elements) {
    if (!overlayState.tones) {
      updateCount('tones', '—');
      return;
    }

    var tones = [
      { id:'accent', rgb:tokenRgb('--accent') },
      { id:'operator', rgb:tokenRgb('--state-operator') },
      { id:'null', rgb:tokenRgb('--data-null') },
      { id:'ok', rgb:tokenRgb('--data-ok') }
    ];
    var count = 0;

    elements.forEach(function (element) {
      var found = elementTones(element, tones);
      if (!found.length) return;
      element.setAttribute('data-debug-tone', found.join(' '));
      count++;
    });
    updateCount('tones', String(count));
  }

  function marker(className, rect, text) {
    var el = document.createElement('span');
    el.className = className;
    el.style.left = Math.max(0, rect.left) + 'px';
    el.style.top = Math.max(0, rect.top) + 'px';
    if (className.indexOf('debug-target-marker') !== -1) {
      el.style.width = rect.width + 'px';
      el.style.height = rect.height + 'px';
    }
    if (text) el.textContent = text;
    markerLayer.appendChild(el);
  }

  function isOnScreen(rect) {
    return rect.bottom > 0 && rect.right > 0 &&
      rect.top < window.innerHeight && rect.left < window.innerWidth;
  }

  function targetStats(focusables) {
    var failed = focusables.filter(function (element) {
      var rect = element.getBoundingClientRect();
      return rect.width < 24 || rect.height < 24;
    });
    return { total:focusables.length, failed:failed.length };
  }

  function renderFocusAndTargets(focusables) {
    if (overlayState.focus) {
      focusables.forEach(function (element, index) {
        var rect = element.getBoundingClientRect();
        if (isOnScreen(rect)) marker('debug-focus-marker', rect, String(index + 1));
      });
      updateCount('focus', String(focusables.length));
    } else {
      updateCount('focus', '—');
    }

    var stats = targetStats(focusables);
    if (overlayState.targets) {
      focusables.forEach(function (element) {
        var rect = element.getBoundingClientRect();
        if (!isOnScreen(rect)) return;
        var status = rect.width < 24 || rect.height < 24 ? ' fail' : ' pass';
        marker('debug-target-marker' + status, rect, '');
      });
    }
    updateCount('targets', stats.failed + '/' + stats.total);
    return stats;
  }

  function refreshOverlays() {
    refreshQueued = false;
    clearDebugMarks();

    var elements = allPageElements();
    var focusables = focusableElements();
    overlayLayer.classList.toggle('has-grid', !!overlayState.grid);
    root.toggleAttribute('data-debug-grid', !!overlayState.grid);
    root.toggleAttribute('data-debug-layout', !!overlayState.layout);
    root.toggleAttribute('data-debug-overflow', !!overlayState.overflow);
    root.toggleAttribute('data-debug-tones', !!overlayState.tones);
    updateCount('grid', overlayState.grid ? 'On' : '—');

    renderLayout(elements);
    renderOverflow(elements);
    renderTones(elements);
    renderFocusAndTargets(focusables);
    updatePanelState();
  }

  function scheduleRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(refreshOverlays);
  }

  function updatePanelState() {
    if (!panel) return;
    var ids = enabledOverlayIds();
    var summary = current.label + (ids.length ? ' · ' + ids.length + ' view' + (ids.length === 1 ? '' : 's') : '');
    setText('[data-debug-summary]', summary);
    setText('[data-debug-saved]', ids.length ?
      'Active: ' + current.label + ' · ' + ids.join(', ') :
      'Active: ' + current.label + ' · no overlays');
    panel.querySelector('summary').setAttribute(
      'aria-label',
      'Local debug. Accent: ' + current.label + '. ' + ids.length + ' visual overlays active.'
    );
  }

  function setCopyStatus(message) {
    clearTimeout(copyTimer);
    setText('[data-debug-copy-status]', message);
    copyTimer = setTimeout(function () {
      setText('[data-debug-copy-status]', '');
    }, 2600);
  }

  function copyText(value, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        setCopyStatus(successMessage);
      }).catch(function () {
        fallbackCopy(value, successMessage);
      });
      return;
    }
    fallbackCopy(value, successMessage);
  }

  function fallbackCopy(value, successMessage) {
    var textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.className = 'debug-copy-fallback';
    document.body.appendChild(textarea);
    textarea.select();
    var copied = false;
    try { copied = document.execCommand('copy'); } catch (e) {}
    textarea.remove();
    setCopyStatus(copied ? successMessage : 'Copy unavailable');
  }

  function debugUrl() {
    var url = new URL(window.location.href);
    var ids = enabledOverlayIds();
    url.searchParams.set('debug', '1');
    if (current.id === 'original') url.searchParams.delete('dbgAccent');
    else url.searchParams.set('dbgAccent', current.id);
    if (ids.length) url.searchParams.set('dbg', ids.join(','));
    else url.searchParams.delete('dbg');
    return url.toString();
  }

  function fontStatus(name) {
    if (!document.fonts || !document.fonts.check) return 'unknown';
    return document.fonts.check('16px "' + name + '"') ? 'loaded' : 'fallback';
  }

  function diagnosticReport() {
    var values = contrastValues(current);
    var focusables = focusableElements();
    var targets = targetStats(focusables);
    var overflow = findOverflow(allPageElements());
    return [
      'Djoaniel local debug',
      'Page: ' + window.location.href,
      'Captured: ' + new Date().toISOString(),
      '',
      'Viewport: ' + window.innerWidth + ' × ' + window.innerHeight + ' CSS px',
      'Device pixel ratio: ' + window.devicePixelRatio,
      'Pointer: ' + (matchMedia('(pointer:fine)').matches ? 'fine' : 'coarse/none'),
      'Hover: ' + (matchMedia('(hover:hover)').matches ? 'available' : 'unavailable'),
      'Reduced motion: ' + (matchMedia('(prefers-reduced-motion:reduce)').matches ? 'yes' : 'no'),
      '',
      'Accent: ' + current.label + ' ' + current.hex,
      'Accent / Paper: ' + ratioLabel(values.paper, 4.5),
      'Accent / White: ' + ratioLabel(values.white, 4.5),
      'Focus / Paper: ' + ratioLabel(values.paper, 3),
      'Overlays: ' + (enabledOverlayIds().join(', ') || 'none'),
      '',
      'Fonts: Instrument Serif ' + fontStatus('Instrument Serif') +
        '; Radio Canada ' + fontStatus('Radio Canada') +
        '; IBM Plex Mono ' + fontStatus('IBM Plex Mono'),
      'Overflow containers: ' + overflow.length,
      'Targets below 24 px: ' + targets.failed + ' / ' + targets.total
    ].join('\n');
  }

  function resetDebug() {
    removeStored(ACCENT_KEY);
    removeStored(OVERLAY_KEY);
    OVERLAYS.forEach(function (item) {
      overlayState[item.id] = false;
    });

    var url = new URL(window.location.href);
    url.searchParams.delete('dbgAccent');
    url.searchParams.delete('dbg');
    history.replaceState(null, '', url.toString());

    document.querySelectorAll('.debug-switch input').forEach(function (input) {
      input.checked = false;
    });
    applyAccent(ACCENTS[0], false);
    refreshOverlays();
    setCopyStatus('Debug settings reset');
  }

  document.querySelectorAll('.debug-accent input[name="debug-accent"]').forEach(function (input) {
    input.addEventListener('change', function () {
      if (!input.checked) return;
      applyAccent(findAccent(input.value), true);
    });
  });

  document.querySelectorAll('.debug-switch input').forEach(function (input) {
    input.addEventListener('change', function () {
      overlayState[input.value] = input.checked;
      persistOverlayState();
      refreshOverlays();
    });
  });

  document.querySelectorAll('[data-debug-action]').forEach(function (button) {
    button.addEventListener('click', function () {
      var action = button.getAttribute('data-debug-action');
      if (action === 'report') copyText(diagnosticReport(), 'Diagnostic report copied');
      if (action === 'url') copyText(debugUrl(), 'Debug URL copied');
      if (action === 'reset') resetDebug();
    });
  });

  window.addEventListener('resize', scheduleRefresh, { passive:true });
  window.addEventListener('scroll', scheduleRefresh, { passive:true, capture:true });
  panel.addEventListener('toggle', function () {
    if (panel.open) scheduleRefresh();
  });

  updateContrast();
  refreshOverlays();
})();
