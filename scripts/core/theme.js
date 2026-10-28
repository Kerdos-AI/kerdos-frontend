/* ════════════════════════════════════════════════════════════
   theme.js — runtime único do tema.

   Responsabilidades:
     • aplicar / persistir a preferência (dark | light | system)
     • migração v2 (o padrão mudou de 'dark' para 'system')
     • ouvir prefers-color-scheme quando a pref é 'system'
     • emitir 'kerdos:themechange' para quem precisa reagir
       (highlight.js, gráficos, widgets futuros)
     • transição temporizada via .theme-switching
     • ligar QUALQUER .theme-opt[data-theme] da página — o
       seletor de 3 cards do modal e o mini-toggle injetado por
       theme-toggle.js compartilham esse mesmo contrato

   A PRIMEIRA pintura NÃO é feita aqui: quem faz é o snippet
   inline bloqueante no <head> de cada página (anti-FOUC).
   Este arquivo é `defer` e só assume o controle depois.
════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY     = 'kerdos-theme';
  var MIG_KEY = 'kerdos-theme-v2';
  var DEFAULT = 'system';
  var mq      = window.matchMedia('(prefers-color-scheme: dark)');
  var root    = document.documentElement;

  function ls(fn, fallback) {
    try { return fn(window.localStorage); } catch (e) { return fallback; }
  }

  /* ── Migração v2 ──────────────────────────────────────────
     Toda a base já tem kerdos-theme='dark' gravado, porque a
     versão antiga persistia a cada boot. Sem apagar esse valor,
     mudar o padrão para 'system' seria um no-op para 100% dos
     usuários existentes. Roda uma vez só.
     (O snippet inline faz a mesma migração — precisa fazer,
     senão a primeira pintura discorda deste arquivo.) */
  ls(function (s) {
    if (!s.getItem(MIG_KEY)) {
      if (s.getItem(KEY) === 'dark') s.removeItem(KEY);
      s.setItem(MIG_KEY, '1');
    }
  });

  function readPref() {
    var q = (location.search.match(/[?&]theme=(dark|light|system)/) || [])[1];
    if (q) return q;
    var v = ls(function (s) { return s.getItem(KEY); });
    return (v === 'dark' || v === 'light' || v === 'system') ? v : DEFAULT;
  }

  function resolve(pref) {
    if (pref === 'dark')  return 'dark';
    if (pref === 'light') return 'light';
    return mq.matches ? 'dark' : 'light';
  }

  /* Marca uma janela curta em que as superfícies podem animar.
     NUNCA `* { transition: background-color }`: com 1.5k nós de
     markup isso obriga o compositor a animar a árvore inteira e
     deixa todo hover subsequente lento para sempre. */
  var switchTO;
  function flashTransition() {
    root.classList.add('theme-switching');
    clearTimeout(switchTO);
    switchTO = setTimeout(function () {
      root.classList.remove('theme-switching');
    }, 240);
  }

  function syncUI(pref) {
    var opts = document.querySelectorAll('.theme-opt[data-theme]');
    for (var i = 0; i < opts.length; i++) {
      var on = opts[i].dataset.theme === pref;
      opts[i].classList.toggle('active', on);
      opts[i].setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  /* opts.persist — só um clique explícito do usuário grava.
     O boot NÃO grava; era exatamente isso que congelava todo
     mundo em 'dark' na versão antiga. */
  function applyTheme(pref, opts) {
    opts = opts || {};
    if (pref !== 'dark' && pref !== 'light' && pref !== 'system') pref = DEFAULT;

    var resolved = resolve(pref);
    var changed  = root.dataset.theme !== resolved;

    if (opts.animate && changed) flashTransition();

    root.classList.toggle('light-mode', resolved === 'light');
    root.dataset.theme     = resolved;   /* hook p/ CSS e JS futuro */
    root.dataset.themePref = pref;

    if (opts.persist) ls(function (s) { s.setItem(KEY, pref); });

    syncUI(pref);

    window.dispatchEvent(new CustomEvent('kerdos:themechange', {
      detail: { theme: pref, resolved: resolved }
    }));
  }

  /* Boot: reafirma o que o snippet inline já pintou (sem gravar,
     sem animar) e dispara o primeiro evento para os listeners. */
  applyTheme(readPref(), { persist: false });

  /* Preferência do SO mudou — só importa se a pref é 'system'. */
  var onSystemChange = function () {
    if (readPref() === 'system') applyTheme('system', { persist: false, animate: true });
  };
  if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
  else if (mq.addListener) mq.addListener(onSystemChange);

  /* Delegado: pega tanto o seletor de 3 cards do modal quanto o
     mini-toggle, que é injetado depois deste script rodar. */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.theme-opt[data-theme]');
    if (!btn) return;
    e.preventDefault();
    applyTheme(btn.dataset.theme, { persist: true, animate: true });
  });

  /* highlight.js — as duas folhas ficam no <head> das páginas que
     têm blocos de código; aqui só se decide qual está ativa. */
  function syncHljs(resolved) {
    var d = document.getElementById('hljs-dark');
    var l = document.getElementById('hljs-light');
    if (!d || !l) return;
    var escuro = resolved === 'dark';
    d.media = escuro ? 'all' : 'not all';
    l.media = escuro ? 'not all' : 'all';
  }
  window.addEventListener('kerdos:themechange', function (e) {
    syncHljs(e.detail.resolved);
  });
  syncHljs(root.dataset.theme);

  window.KerdosTheme = {
    get:   readPref,
    set:   function (pref) { applyTheme(pref, { persist: true, animate: true }); },
    resolved: function () { return root.dataset.theme; },
    sync:  function () { syncUI(readPref()); }
  };
})();
