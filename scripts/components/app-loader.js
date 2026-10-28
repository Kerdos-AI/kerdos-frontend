/* ═══════════════════════════════════════════════════════
   app-loader.js — loader do app logado (app.html / _t.html)
   Injeta o #loader (spinner gold "KERDOS FINANCE") no topo do
   <body> e faz o fade-out após o load. scripts/intro.js observa
   a classe .out deste elemento para saber quando disparar a
   entrada das views (Voithos/Argos/Plutos) — não renomear/remover
   sem atualizar intro.js junto.

   As demais páginas (home, agentes, planos, login, onboarding,
   voithos) usam o loader novo, com threshold: styles/loader.css
   + scripts/loader.js.

   Os estilos vivem em style.css (#loader, .l-ring, .l-gem,
   .loader-label). Requer que a página carregue style.css.

   Uso: <script src="../scripts/app-loader.js"></script>
        logo após a abertura do <body>.
   Se a página já tiver <div id="loader"> inline, não duplica.

   Exceção: quando a navegação vem do slide Voithos↔Argos
   (scripts/page-transition.js), o loader fica de fora — ele é
   opaco e dura ~2.6s, o que encobriria por completo o slide de
   380ms. O próprio slide já comunica a transição nesse caso.
   Esse script roda ANTES do page-transition.js (que é deferred),
   então a chave no sessionStorage ainda não foi lida/limpa.
═══════════════════════════════════════════════════════ */
(function () {
  if (document.getElementById('loader')) return; // markup inline já presente

  try {
    if (sessionStorage.getItem('kerdos_page_transition')) return;
  } catch (e) {}

  var LOADER_HTML =
    '<div id="loader">' +
      '<div class="loader-symbol">' +
        '<div class="l-ring l-ring-2"></div>' +
        '<div class="l-ring l-ring-1"></div>' +
        '<svg class="l-gem" viewBox="0 0 30 30" aria-hidden="true">' +
          '<path d="M15 0C16.5053 0 17.9588 0.221919 19.3296 0.634509L17.7931 4.3034C16.9009 4.07109 15.9649 3.94737 15 3.94737C8.8958 3.94737 3.94737 8.8958 3.94737 15C3.94737 19.8907 7.12392 24.0393 11.5263 25.4955V30H3V26.6842H5.59339C2.18233 23.9347 0 19.7223 0 15C0 6.71573 6.71573 0 15 0Z"/>' +
          '<path d="M23.2221 2.4523C27.3044 5.13271 30 9.75151 30 15C30 19.7223 27.8178 23.9348 24.4068 26.6842H27.3158V30H18.6316V25.4419C22.9518 23.9395 26.0526 19.832 26.0526 15C26.0526 11.3973 24.3288 8.19742 21.6612 6.17964L23.2221 2.4523Z"/>' +
        '</svg>' +
      '</div>' +
      '<span class="loader-label">Kerdos Finance</span>' +
    '</div>';

  function inject() {
    if (document.getElementById('loader')) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = LOADER_HTML;
    var loader = tmp.firstChild;
    document.body.insertBefore(loader, document.body.firstChild);
  }

  /* Injeta o quanto antes — se o <body> já existe (script síncrono no
     topo do body), cobre a página desde o primeiro paint. */
  if (document.body) {
    inject();
  } else {
    document.addEventListener('DOMContentLoaded', inject);
  }

  function hide() {
    var el = document.getElementById('loader');
    if (el) el.classList.add('out');
  }

  /* Mesmo timing das outras páginas: some 1.8s após o load. */
  window.addEventListener('load', function () {
    setTimeout(hide, 1800);
  });
})();
