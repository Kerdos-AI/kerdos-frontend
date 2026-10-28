/* ════════════════════════════════════════════════════════════
   lista-espera.js — popup de inscrição no lançamento.

   Abre em qualquer elemento com [data-lista-espera]. Estilo em
   styles/components/lista-espera.css.

   Segurança — o que este arquivo garante e o que NÃO garante:
   · Nada digitado pelo usuário volta para a página como HTML. O
     markup abaixo é estático; texto dinâmico só entra por
     textContent. Mantenha assim: innerHTML com dado do usuário
     é XSS.
   · A validação aqui é conforto, não proteção. Qualquer um manda
     um POST direto para o endpoint sem passar por este arquivo.
     Limite de tamanho, formato, honeypot e rate limit precisam
     ser checados DE NOVO no servidor.
   · ENDPOINT fica vazio até o backend existir. Sem ele, o envio
     só "funciona" em localhost (para revisar o design); em
     produção mostra erro em vez de fingir que inscreveu alguém.
════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ENDPOINT = '/api/waitlist';

  var LIMITES = { nome: 120, email: 160 };

  /* Valores fechados: o servidor deve aceitar só estes três e
     descartar qualquer outro que chegue no POST. */
  var INTERESSES = ['voithos', 'argos', 'plutos'];

  function opcao(valor, texto, agente) {
    return '<label class="le-opcao">' +
      '<input type="checkbox" name="interesses" value="' + valor + '">' +
      '<span class="le-opcao-texto">' + texto + '</span>' +
      '<span class="le-opcao-agente">' + agente + '</span>' +
    '</label>';
  }

  var MARKUP =
    '<div class="le-card" role="dialog" aria-modal="true" aria-labelledby="le-titulo">' +
      '<button type="button" class="le-fechar" aria-label="Fechar">' +
        '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
      '<span class="le-eyebrow">LISTA DE ESPERA</span>' +
      '<h2 class="le-titulo" id="le-titulo">Seja um dos primeiros a usar a Kerdos.</h2>' +
      '<p class="le-sub">Deixa seu contato e conta pra gente o que quer testar primeiro. Avisamos assim que as contas abrirem.</p>' +

      '<form class="le-form" novalidate>' +
        '<div class="le-campo" data-campo="nome">' +
          '<label class="le-label" for="le-nome">Nome completo</label>' +
          '<input class="le-input" id="le-nome" name="nome" type="text" autocomplete="name" maxlength="' + LIMITES.nome + '" placeholder="Como você se chama?" required>' +
          '<span class="le-erro" aria-live="polite"></span>' +
        '</div>' +
        '<div class="le-campo" data-campo="telefone">' +
          '<label class="le-label" for="le-telefone">Telefone (WhatsApp)</label>' +
          '<input class="le-input" id="le-telefone" name="telefone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="15" placeholder="(11) 91234-5678" required>' +
          '<span class="le-erro" aria-live="polite"></span>' +
        '</div>' +
        '<div class="le-campo" data-campo="email">' +
          '<label class="le-label" for="le-email">E-mail</label>' +
          '<input class="le-input" id="le-email" name="email" type="email" autocomplete="email" maxlength="' + LIMITES.email + '" placeholder="voce@email.com" required>' +
          '<span class="le-erro" aria-live="polite"></span>' +
        '</div>' +
        '<fieldset class="le-campo le-grupo" data-campo="interesses">' +
          '<legend class="le-label">O que você mais quer testar na Kerdos?</legend>' +
          '<span class="le-dica">Pode marcar mais de um.</span>' +
          '<div class="le-opcoes">' +
            opcao('voithos', 'Organizar gastos pelo WhatsApp', 'Voithos') +
            opcao('argos',   'Análise 360° dos meus extratos', 'Argos') +
            opcao('plutos',  'Planejamento e investimentos',   'Plutos') +
          '</div>' +
          '<span class="le-erro" aria-live="polite"></span>' +
        '</fieldset>' +

        /* Honeypot: humano não vê nem alcança pelo Tab. Robô que
           preenche tudo cai aqui, e o envio é descartado. */
        '<div class="le-mel" aria-hidden="true">' +
          '<label for="le-site">Site</label>' +
          '<input id="le-site" name="site" type="text" tabindex="-1" autocomplete="off">' +
        '</div>' +

        '<button type="submit" class="le-enviar">Quero ser avisado</button>' +
        '<p class="le-erro-geral" aria-live="polite"></p>' +
      '</form>' +

      '<div class="le-sucesso" aria-live="polite">' +
        '<div class="le-sucesso-icone"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>' +
        '<p>Pronto, você está na lista. Assim que a Kerdos abrir, você fica sabendo antes de todo mundo.</p>' +
        '<button type="button" class="le-enviar le-ok">Fechar</button>' +
      '</div>' +
    '</div>';

  var overlay, card, form, ultimoFoco;

  function montar() {
    overlay = document.createElement('div');
    overlay.className = 'le-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = MARKUP;
    document.body.appendChild(overlay);

    card = overlay.querySelector('.le-card');
    form = overlay.querySelector('.le-form');

    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) fechar(); });
    overlay.querySelector('.le-fechar').addEventListener('click', fechar);
    overlay.querySelector('.le-ok').addEventListener('click', fechar);
    overlay.addEventListener('keydown', aoTeclar);

    var tel = form.elements.telefone;
    tel.addEventListener('input', function () { tel.value = mascararTelefone(tel.value); });

    /* Limpa o erro do campo assim que a pessoa volta a mexer nele. */
    form.addEventListener('input', function (e) {
      var campo = e.target.closest('.le-campo');
      if (campo) marcarErro(campo.getAttribute('data-campo'), '');
    });

    form.addEventListener('submit', aoEnviar);
  }

  /* ── Abrir / fechar ── */
  function abrir() {
    if (!overlay) montar();
    ultimoFoco = document.activeElement;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    setTimeout(function () { form.elements.nome.focus(); }, 60);
  }

  function fechar() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  /* Esc fecha; Tab fica preso dentro do card. */
  function aoTeclar(e) {
    if (e.key === 'Escape') { fechar(); return; }
    if (e.key !== 'Tab') return;
    var focaveis = Array.prototype.filter.call(
      card.querySelectorAll('button, input, textarea, a[href]'),
      function (el) { return el.offsetParent !== null && el.tabIndex !== -1; }
    );
    if (!focaveis.length) return;
    var primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  }

  /* ── Validação ── */
  function soDigitos(v) { return v.replace(/\D/g, ''); }

  function mascararTelefone(v) {
    var d = soDigitos(v).slice(0, 11);
    if (d.length <= 2)  return d.length ? '(' + d : '';
    if (d.length <= 6)  return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function marcarErro(nome, msg) {
    var campo = form.querySelector('[data-campo="' + nome + '"]');
    if (!campo) return;
    campo.classList.toggle('tem-erro', !!msg);
    campo.querySelector('.le-erro').textContent = msg;
  }

  function validar(d) {
    var erros = {};
    if (d.nome.length < 3 || d.nome.indexOf(' ') === -1) erros.nome = 'Escreva seu nome e sobrenome.';
    if (!/^[1-9]{2}9?\d{8}$/.test(d.telefone))           erros.telefone = 'Use DDD + número, como (11) 91234-5678.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email))   erros.email = 'Esse e-mail não parece válido.';
    if (!d.interesses.length)                             erros.interesses = 'Escolha pelo menos uma opção.';
    return erros;
  }

  function coletar() {
    var el = form.elements;
    return {
      nome: el.nome.value.trim().replace(/\s+/g, ' ').slice(0, LIMITES.nome),
      telefone: soDigitos(el.telefone.value),
      email: el.email.value.trim().toLowerCase().slice(0, LIMITES.email),
      interesses: Array.prototype.filter.call(
        form.querySelectorAll('input[name="interesses"]:checked'),
        function (c) { return INTERESSES.indexOf(c.value) !== -1; }
      ).map(function (c) { return c.value; }),
      site: el.site.value
    };
  }

  /* ── Envio ── */
  var enviando = false;

  function aoEnviar(e) {
    e.preventDefault();
    if (enviando) return;

    var dados = coletar();
    var erroGeral = form.querySelector('.le-erro-geral');
    erroGeral.textContent = '';

    ['nome', 'telefone', 'email', 'interesses'].forEach(function (k) { marcarErro(k, ''); });
    var erros = validar(dados);
    var chaves = Object.keys(erros);
    if (chaves.length) {
      chaves.forEach(function (k) { marcarErro(k, erros[k]); });
      var primeiro = form.querySelector('[data-campo="' + chaves[0] + '"] input');
      if (primeiro) primeiro.focus();
      return;
    }

    /* Honeypot preenchido: finge sucesso para o robô não aprender. */
    if (dados.site) { card.classList.add('enviado'); return; }

    var botao = form.querySelector('.le-enviar');
    enviando = true;
    botao.disabled = true;
    botao.textContent = 'Enviando…';

    enviar(dados).then(function () {
      card.classList.add('enviado');
      form.reset();
    }).catch(function () {
      erroGeral.textContent = 'Não conseguimos enviar agora. Tente de novo em instantes.';
    }).then(function () {
      enviando = false;
      botao.disabled = false;
      botao.textContent = 'Quero ser avisado';
    });
  }

  function enviar(dados) {
    var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if (local) {
      console.warn('[lista-espera] Modo local detectado: envio simulado em localhost.', dados);
      return new Promise(function (ok) { setTimeout(ok, 700); });
    }
    if (!ENDPOINT) {
      return Promise.reject(new Error('ENDPOINT não configurado'));
    }
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: dados.nome,
        telefone: dados.telefone,
        email: dados.email,
        interesses: dados.interesses,
        site: dados.site
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
    });
  }

  /* ── Gatilhos ── */
  document.addEventListener('click', function (e) {
    var gatilho = e.target.closest('[data-lista-espera]');
    if (!gatilho) return;
    e.preventDefault();
    abrir();
  });

  window.KerdosListaEspera = { abrir: abrir };
})();
