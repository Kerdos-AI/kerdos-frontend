/* ════════════════════════════════════════════════════════════
   swipe.js — arrastar com o dedo para os lados.

   KerdosSwipe(el, { onStart, onMove, onEnd, width }) liga o gesto em `el`:
   · onStart()           quando o gesto é confirmado como horizontal.
   · width()             largura usada no limite de troca (padrão: a de el).
   · onMove(dx)         a cada quadro do arraste, com o deslocamento
                         horizontal em px — para o conteúdo seguir o dedo.
   · onEnd(dir)          ao soltar: -1 (arrastou para a esquerda → próximo),
                         +1 (para a direita → anterior) ou 0 (não passou do
                         limite, volta para onde estava).

   Por que touch events e não pointer events: só o touch deixa decidir
   a direção DEPOIS de alguns pixels. O gesto começa neutro; se o dedo
   andar mais na vertical, a página rola normalmente e o swipe desiste.
   Só quando é claramente horizontal ele assume o gesto. O CSS completa
   com touch-action: pan-y nos alvos.

   Depois de um swipe, o click sintético que o navegador dispara ao
   soltar é engolido — senão arrastar o card do "Quem somos" abriria o
   popup dele.
════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var LOCK_PX   = 8;     // quanto o dedo anda antes de decidir a direção
  var COMMIT    = 0.22;  // fração da largura que confirma a troca
  var FLICK_V   = 0.35;  // px/ms: um flick rápido troca mesmo se curto
  var FLICK_MIN = 24;    // px mínimos para o flick valer

  function KerdosSwipe(el, opts) {
    var startX, startY, startT, dx, lock; // lock: null | 'x' | 'y'
    var tracking = false;

    function reset() { tracking = false; lock = null; dx = 0; }
    reset();

    el.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { cancel(); return; }
      var t = e.touches[0];
      startX = t.clientX; startY = t.clientY; startT = Date.now();
      dx = 0; lock = null; tracking = true;
    }, { passive: true });

    el.addEventListener('touchmove', function (e) {
      if (!tracking) return;
      if (e.touches.length !== 1) { cancel(); return; }
      var t = e.touches[0];
      var mx = t.clientX - startX;
      var my = t.clientY - startY;

      if (!lock) {
        if (Math.abs(mx) < LOCK_PX && Math.abs(my) < LOCK_PX) return;
        lock = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
        if (lock === 'y') { tracking = false; return; } // rolagem da página
        if (opts.onStart) opts.onStart();
      }

      e.preventDefault();
      dx = mx;
      if (opts.onMove) opts.onMove(dx);
    }, { passive: false });

    function finish() {
      if (!tracking) return;
      var wasX = lock === 'x';
      var dt   = Math.max(1, Date.now() - startT);
      var w    = (opts.width ? opts.width() : el.offsetWidth) || 1;
      var dir  = 0;
      if (wasX) {
        var fast = Math.abs(dx) / dt > FLICK_V && Math.abs(dx) > FLICK_MIN;
        if (fast || Math.abs(dx) > w * COMMIT) dir = dx < 0 ? -1 : 1;
        swallowClick();
      }
      reset();
      if (wasX && opts.onEnd) opts.onEnd(dir);
    }

    function cancel() {
      var wasX = tracking && lock === 'x';
      reset();
      if (wasX && opts.onEnd) opts.onEnd(0);
    }

    el.addEventListener('touchend', finish);
    el.addEventListener('touchcancel', cancel);

    function swallowClick() {
      function stop(e) { e.stopPropagation(); e.preventDefault(); }
      el.addEventListener('click', stop, true);
      setTimeout(function () { el.removeEventListener('click', stop, true); }, 400);
    }

    return { isDragging: function () { return lock === 'x' && tracking; } };
  }

  window.KerdosSwipe = KerdosSwipe;
})();
