/* cursor.js — KERDOS FINANCE custom cursor — context-aware gold dot
   Vanilla JS only. No external libs.
   Only activates on hover-capable, fine-pointer devices (mouse/trackpad).
*/
(function () {
  'use strict';

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  /* ── Preference helpers ── */
  function readCursorPref() {
    try {
      var raw = localStorage.getItem('kerdos_perfil_usuario');
      if (!raw) return true;
      var obj = JSON.parse(raw);
      return obj.cursor_customizado !== false;
    } catch (e) { return true; }
  }

  function saveCursorPref(val) {
    try {
      var raw = localStorage.getItem('kerdos_perfil_usuario');
      var obj = raw ? JSON.parse(raw) : {};
      obj.cursor_customizado = val;
      localStorage.setItem('kerdos_perfil_usuario', JSON.stringify(obj));
    } catch (e) {}
  }

  /* ── State ── */
  var dotEl   = null;
  var rafId   = null;
  var enabled = false;
  var targetX = -300, targetY = -300;

  var curState  = '';
  var STATE_CLS = ['kd-hover', 'kd-text', 'kd-input'];

  /* ── Context selectors ── */
  var HOVER_SEL = 'a, button, [role="button"], .btn, .cta, .nav-cta, label, [data-cursor="hover"]';
  var INPUT_SEL = 'input, textarea, select, [contenteditable]';
  var TEXT_SEL  = 'p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, .vt-msg-text, .vt-welcome-greeting';

  /* ── State management ── */
  function setState(s) {
    if (curState === s) return;
    curState = s;
    if (!dotEl) return;
    STATE_CLS.forEach(function (c) { dotEl.classList.remove(c); });
    if (s) dotEl.classList.add('kd-' + s);
  }

  /* ── rAF loop — exact position, no lerp ── */
  function tick() {
    if (!enabled) return;
    dotEl.style.transform = 'translate3d(' + targetX + 'px,' + targetY + 'px,0)';
    rafId = requestAnimationFrame(tick);
  }

  /* ── Event handlers ── */
  function onMouseMove(e) { targetX = e.clientX; targetY = e.clientY; }

  function onMouseOver(e) {
    if (!e.target || !e.target.closest) return;
    var t = e.target;
    if      (t.closest(INPUT_SEL)) setState('input');
    else if (t.closest(HOVER_SEL)) setState('hover');
    else if (t.closest(TEXT_SEL))  setState('text');
    else                           setState('');
  }

  function onMouseLeave() { if (dotEl) dotEl.classList.add('kd-out'); }
  function onMouseEnter() { if (dotEl) dotEl.classList.remove('kd-out'); }

  function attachEvents() {
    document.addEventListener('mousemove',  onMouseMove,  { passive: true });
    document.addEventListener('mouseover',  onMouseOver);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
  }

  function detachEvents() {
    document.removeEventListener('mousemove',  onMouseMove);
    document.removeEventListener('mouseover',  onMouseOver);
    document.removeEventListener('mouseleave', onMouseLeave);
    document.removeEventListener('mouseenter', onMouseEnter);
  }

  function createDot() {
    dotEl = document.createElement('div');
    dotEl.id = 'kd-cursor-dot';
    dotEl.setAttribute('aria-hidden', 'true');
    var inner = document.createElement('div');
    inner.id = 'kd-cursor-dot-inner';
    dotEl.appendChild(inner);
    document.body.appendChild(dotEl);
    document.body.classList.add('kd-cursor-active');
  }

  function destroyDot() {
    if (dotEl && dotEl.parentNode) dotEl.parentNode.removeChild(dotEl);
    dotEl = null;
    document.body.classList.remove('kd-cursor-active');
  }

  /* ── Public API — called by modal-perfil.js toggle ── */
  window.kdCursor = {
    enable: function () {
      if (enabled) return;
      enabled = true;
      saveCursorPref(true);
      targetX = -300; targetY = -300;
      createDot();
      attachEvents();
      rafId = requestAnimationFrame(tick);
    },
    disable: function () {
      if (!enabled) return;
      enabled = false;
      saveCursorPref(false);
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      detachEvents();
      destroyDot();
    }
  };

  if (readCursorPref()) window.kdCursor.enable();

})();
