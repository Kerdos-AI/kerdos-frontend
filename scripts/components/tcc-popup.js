/* ════════════════════════════════════════════════════════════
   tcc-popup.js — Modal informativo de TCC & Lançamento MVP 2027
   Exibido ao clicar em qualquer botão de assinatura / upgrade.
   Componente autocontido: injeta seus próprios estilos e DOM.
════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ID_MODAL  = 'tcc-subscription-modal';
  var ID_STYLES = 'tcc-subscription-styles';

  /* ── 1. Injeção de Estilos (tema escuro único) ── */
  function injectStyles() {
    if (document.getElementById(ID_STYLES)) return;

    var css = `
      .tcc-backdrop {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(0, 0, 0, 0.72);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.26s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.26s;
      }
      .tcc-backdrop.is-open {
        opacity: 1;
        visibility: visible;
      }
      .tcc-card {
        position: relative;
        width: 100%;
        max-width: 500px;
        background: #141413;
        border: 1px solid rgba(228, 156, 0, 0.32);
        border-radius: 22px;
        padding: 36px 32px 30px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.65), 0 0 36px rgba(228, 156, 0, 0.12);
        color: #ffffff;
        font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
        transform: scale(0.93) translateY(16px);
        transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
      }
      .tcc-backdrop.is-open .tcc-card {
        transform: scale(1) translateY(0);
      }
      /* Efeito de brilho de fundo no topo */
      .tcc-card-glow {
        position: absolute;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        width: 280px;
        height: 140px;
        background: radial-gradient(circle, rgba(228, 156, 0, 0.25) 0%, transparent 70%);
        pointer-events: none;
        filter: blur(28px);
      }
      /* Botão fechar */
      .tcc-close-btn {
        position: absolute;
        top: 18px;
        right: 18px;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        transition: background 0.18s, color 0.18s, transform 0.18s;
        z-index: 2;
      }
      .tcc-close-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
        transform: scale(1.05);
      }
      .tcc-close-btn svg {
        width: 15px;
        height: 15px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2.2;
        stroke-linecap: round;
      }
      /* Badge acadêmico */
      .tcc-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 13px;
        border-radius: 999px;
        background: rgba(228, 156, 0, 0.12);
        border: 1px solid rgba(228, 156, 0, 0.28);
        /* Texto dourado pelo token de TINTA, que o tema escurece no claro
           (#E49C00 sobre branco dava 2,1:1). O CSS injetado resolve var()
           como qualquer folha — sem getComputedStyle, sem re-render. */
        color: var(--brand-ink, #E49C00);
        font-size: 11.5px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-bottom: 18px;
      }
      /* Ícone de destaque */
      .tcc-icon-wrap {
        width: 58px;
        height: 58px;
        margin: 0 auto 16px;
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(228, 156, 0, 0.2), rgba(228, 156, 0, 0.05));
        border: 1px solid rgba(228, 156, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFCC00;
        box-shadow: 0 8px 24px rgba(228, 156, 0, 0.18);
      }
      .tcc-icon-wrap svg {
        width: 28px;
        height: 28px;
      }
      .tcc-title {
        font-size: 23px;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 8px;
        letter-spacing: -0.02em;
      }
      .tcc-subtitle {
        font-size: 13.5px;
        font-weight: 600;
        color: var(--brand-ink, #E49C00);
        margin-bottom: 16px;
        letter-spacing: 0.01em;
      }
      .tcc-desc {
        font-size: 14px;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.72);
        margin-bottom: 22px;
        font-weight: 400;
      }
      .tcc-desc strong {
        color: #ffffff;
        font-weight: 600;
      }
      /* Grid de benefícios no TCC */
      .tcc-pills {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 26px;
        text-align: left;
      }
      .tcc-pill-item {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.06);
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.86);
      }
      .tcc-pill-check {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: rgba(228, 156, 0, 0.18);
        color: #FFCC00;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .tcc-pill-check svg {
        width: 11px;
        height: 11px;
        stroke: currentColor;
        stroke-width: 2.4;
        fill: none;
      }
      /* Botão principal */
      .tcc-primary-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 14px 20px;
        background: linear-gradient(135deg, #E49C00, #D48B00);
        color: #0C0C0B;
        border: none;
        border-radius: 14px;
        font-size: 14.5px;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(228, 156, 0, 0.28);
        transition: transform 0.18s, box-shadow 0.18s, filter 0.18s;
      }
      .tcc-primary-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(228, 156, 0, 0.4);
        filter: brightness(1.06);
      }
      .tcc-primary-btn:active {
        transform: translateY(1px);
      }
      /* Responsividade mobile */
      @media (max-width: 520px) {
        .tcc-card {
          padding: 28px 20px 24px;
        }
        .tcc-title {
          font-size: 20px;
        }
        .tcc-desc {
          font-size: 13px;
        }
        .tcc-pill-item {
          font-size: 12.5px;
          padding: 8px 12px;
        }
      }
    `;

    var styleEl = document.createElement('style');
    styleEl.id = ID_STYLES;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  /* ── 2. Injeção do Markup do Modal ── */
  function ensureModalDOM() {
    var existing = document.getElementById(ID_MODAL);
    if (existing) return existing;

    var backdrop = document.createElement('div');
    backdrop.id = ID_MODAL;
    backdrop.className = 'tcc-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'tcc-title');

    backdrop.innerHTML = `
      <div class="tcc-card">
        <div class="tcc-card-glow" aria-hidden="true"></div>
        <button class="tcc-close-btn" id="tcc-btn-close" aria-label="Fechar janela">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div class="tcc-badge">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          Projeto Acadêmico &bull; TCC
        </div>

        <div class="tcc-icon-wrap" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>

        <h3 class="tcc-title" id="tcc-title">Assinaturas em Breve!</h3>
        <div class="tcc-subtitle" id="tcc-subtitle">Lançamento oficial do MVP previsto para 2027 🚀</div>

        <p class="tcc-desc">
          A <strong>Kerdos Finance</strong> está sendo desenvolvida atualmente como um projeto de <strong>Trabalho de Conclusão de Curso (TCC)</strong>. 
          Por este motivo, as assinaturas pagas ainda não estão ativas e todos os recursos de inteligência estão <strong>100% gratuitos</strong> para os primeiros usuários testarem!
        </p>

        <div class="tcc-pills">
          <div class="tcc-pill-item">
            <div class="tcc-pill-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <span><strong>Acesso gratuito</strong> a todos os agentes e dashboards</span>
          </div>
          <div class="tcc-pill-item">
            <div class="tcc-pill-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <span>Integração com <strong>WhatsApp & Telegram</strong> ativa</span>
          </div>
          <div class="tcc-pill-item">
            <div class="tcc-pill-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
            <span>Planos pagos com novos recursos chegam com o <strong>MVP em 2027</strong></span>
          </div>
        </div>

        <button class="tcc-primary-btn" id="tcc-btn-confirm">
          <span>Entendido! Aproveitar versão gratuita</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Eventos de fechamento
    function closePopup() {
      backdrop.classList.remove('is-open');
    }

    backdrop.querySelector('#tcc-btn-close')?.addEventListener('click', closePopup);
    backdrop.querySelector('#tcc-btn-confirm')?.addEventListener('click', closePopup);

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closePopup();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && backdrop.classList.contains('is-open')) {
        closePopup();
      }
    });

    return backdrop;
  }

  /* ── 3. Função Global para Abrir o Modal ── */
  window.showTccPopup = function (planoNome) {
    injectStyles();
    var backdrop = ensureModalDOM();

    if (planoNome) {
      var subEl = backdrop.querySelector('#tcc-subtitle');
      if (subEl) {
        subEl.textContent = 'O plano ' + planoNome + ' será lançado oficialmente no MVP em 2027 🚀';
      }
    }

    // Força reflow para animação fluida
    void backdrop.offsetWidth;
    backdrop.classList.add('is-open');
  };

  /* ── 4. Interceptação Automática de Todos os Botões de Assinar/Upgrade ── */
  document.addEventListener('DOMContentLoaded', function () {
    injectStyles();
    ensureModalDOM();

    // Event Delegation global: captura qualquer clique em botões de assinatura na página de planos
    document.addEventListener('click', function (e) {
      // 1. Classes diretas conhecidas dos botões de assinatura
      var btn = e.target.closest('.plan-cta-gold, .plan-cta-border-gold, [data-assinar]');

      // 2. Se não bateu nas classes, verifica botões/links com texto de assinatura de planos
      if (!btn) {
        var potential = e.target.closest('button, .btn, a');
        if (potential && !potential.classList.contains('tcc-close-btn') && !potential.classList.contains('tcc-primary-btn') && !potential.classList.contains('mp-upgrade-btn')) {
          var txt = (potential.textContent || '').trim().toLowerCase();
          if (
            txt.includes('assinar pro') || 
            txt.includes('assinar ultra') || 
            (txt.startsWith('assinar') && !txt.includes('grátis'))
          ) {
            btn = potential;
          }
        }
      }

      if (btn) {
        e.preventDefault();
        e.stopPropagation();

        var txt = (btn.textContent || '').trim();
        var plano = 'Premium';
        if (txt.toLowerCase().includes('ultra') || txt.toLowerCase().includes('maximus')) {
          plano = 'Maximus';
        } else if (txt.toLowerCase().includes('pro') || txt.toLowerCase().includes('premium')) {
          plano = 'Premium';
        } else {
          plano = 'selecionado';
        }

        window.showTccPopup(plano);
      }
    });

    // Pré-lançamento: o "Começar grátis" mandava para cadastro.html, mas
    // o cadastro está fechado e os botões de plano estão desabilitados
    // ("Em breve"). Ao abrir as contas, reponha o redirecionamento aqui.
  });

})();
