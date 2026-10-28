/* how-it-works.js — KERDOS FINANCE
   Vanilla JS only. No external libs.
   Handles: IntersectionObserver reveals, chat animation,
   dot-grid cascade, chart draw-on, cursor glow, parallax orbs.
*/
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch        = !window.matchMedia('(hover: hover)').matches;

  /* rAF throttle for scroll events */
  function rafThrottle(fn) {
    var ticking = false;
    return function () {
      if (!ticking) {
        requestAnimationFrame(function () { fn(); ticking = false; });
        ticking = true;
      }
    };
  }

  /* ── Header reveal ── */
  var headerEl = document.getElementById('hiw-header');
  if (headerEl) {
    var headerIO = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        headerEl.classList.add('hiw-visible');
        headerIO.unobserve(headerEl);
      }
    }, { threshold: 0.25 });
    headerIO.observe(headerEl);
  }

  /* ── Card cascade reveal ── */
  var cards    = Array.from(document.querySelectorAll('.hiw-card'));
  var captions = Array.from(document.querySelectorAll('.hiw-caption'));
  var DELAYS   = [0, 120, 240, 360];

  var triggered = [false, false, false, false];

  var cardIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var card = entry.target;
      var idx  = cards.indexOf(card);
      if (idx === -1) return;

      setTimeout(function () {
        card.classList.add('hiw-visible');

        /* Switch to snappy hover transitions after entrance completes */
        setTimeout(function () { card.classList.add('hiw-entered'); }, 920);

        /* Caption reveals shortly after card */
        if (captions[idx]) {
          setTimeout(function () { captions[idx].classList.add('hiw-visible'); }, 200);
        }

        /* Card-specific init (once only) */
        if (!triggered[idx]) {
          triggered[idx] = true;
          if (idx === 0) initCard1();
          if (idx === 3) initCard4();
        }
      }, DELAYS[idx] || 0);

      cardIO.unobserve(card);
    });
  }, { threshold: 0.15 });

  cards.forEach(function (card) { cardIO.observe(card); });

  /* ────────────────────────────────────────────
     CARD 1 — Voithos chat sequence
  ──────────────────────────────────────────── */
  function initCard1() {
    /* Scene: user line -> omega drawing -> Voithos answer. The omega and
       the answer live in the SAME bot message (as in the app): swapping
       them inside one block keeps the thread from opening a gap when the
       thinking mark goes away. The hover glow moved to CSS
       (.hiw-card:hover .hiw-vt-avatar) -- there is no bubble left to take
       a box-shadow through style. */
    var b1     = document.getElementById('hiw-b1');
    var bot    = document.getElementById('hiw-b2');
    var mark   = document.getElementById('hiw-typing');
    var answer = document.getElementById('hiw-answer');
    if (!b1 || !bot || !mark || !answer) return;

    function settle() {
      mark.classList.add('hiw-hidden');
      answer.classList.add('hiw-visible');
    }

    if (prefersReduced) {
      b1.classList.add('hiw-visible');
      bot.classList.add('hiw-visible');
      settle();
      return;
    }

    setTimeout(function () { b1.classList.add('hiw-visible'); }, 300);
    setTimeout(function () { bot.classList.add('hiw-visible'); }, 900);
    setTimeout(settle, 2100);
  }

  /* ────────────────────────────────────────────
     CARD 4 — Plutos: one step of the investor journey
  ──────────────────────────────────────────── */
  function initCard4() {
    /* One beat, told in three moves: module 2 gets its check, module 3
       loses the padlock, the hero card crossfades to the newly unlocked
       module and the XP pill counts up. Every state lives in the DOM
       already -- the class on each <li> decides which reading shows --
       so nothing here touches innerHTML.
       The streak pill does NOT move: in the app a streak counts days
       answering the daily review, not modules finished. */
    var mod2 = document.getElementById('hiw-pl-mod2');
    var mod3 = document.getElementById('hiw-pl-mod3');
    var hero = document.getElementById('hiw-pl-hero');
    var xp    = document.getElementById('hiw-pl-xp');
    var feitos = document.getElementById('hiw-pl-feitos');
    if (!mod2 || !mod3 || !hero) return;

    function concluir() {
      mod2.className = 'hiw-pl-mod is-concluida';
      if (feitos) feitos.textContent = '2';
    }
    function destravar() {
      mod3.className = 'hiw-pl-mod is-atual';
      hero.classList.add('is-trocado');
    }

    if (prefersReduced) {
      concluir();
      destravar();
      if (xp) xp.textContent = '320';
      return;
    }

    setTimeout(concluir, 700);
    setTimeout(function () {
      destravar();
      mod3.classList.add('is-destravando');
      if (xp && window.KerdosFormat) {
        window.KerdosFormat.countUp(xp, 320, { valorInicial: 230, duracao: 1100 });
      }
    }, 1400);
  }

  /* ────────────────────────────────────────────
     Cursor glow — CSS variable per card
  ──────────────────────────────────────────── */
  if (!isTouch && !prefersReduced) {
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', ((e.clientX - r.left) / r.width  * 100) + '%');
        card.style.setProperty('--mouse-y', ((e.clientY - r.top)  / r.height * 100) + '%');
      });
    });
  }

  /* ────────────────────────────────────────────
     Parallax orbs — scroll-driven, ~30% speed
  ──────────────────────────────────────────── */
  if (!prefersReduced) {
    var section = document.getElementById('como-funciona');
    var orb1    = document.getElementById('hiw-orb-1');
    var orb2    = document.getElementById('hiw-orb-2');

    if (section && orb1 && orb2) {
      var onScroll = rafThrottle(function () {
        var rect     = section.getBoundingClientRect();
        var progress = -rect.top;
        /* Only run when section is near viewport */
        if (progress < -window.innerHeight || progress > rect.height + window.innerHeight) return;
        var shift = progress * 0.28;
        orb1.style.transform = 'translate3d(0,' + shift + 'px,0)';
        orb2.style.transform = 'translate3d(0,' + (-shift) + 'px,0)';
      });

      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

})();
