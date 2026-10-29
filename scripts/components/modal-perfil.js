(function () {
  'use strict';

  /* ══ MODAL ══ */
  const overlay  = document.getElementById('modal-overlay');
  const navLink  = document.getElementById('nav-perfil');

  function openModal() {
    if (!overlay) return;
    overlay.classList.remove('closing');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    carregarSobreMimBD();
  }

  function closeModal() {
    overlay.classList.add('closing');
    setTimeout(() => {
      overlay.classList.remove('active', 'closing');
      document.body.style.overflow = '';
    }, 260);
  }

  navLink?.addEventListener('click', e => { e.preventDefault(); openModal(); });

  /* No mobile o Perfil da tab bar abre uma tela própria
     (perfil-mobile.js), e é dela que "Conta" e "Notificações" chegam
     aqui — já na aba certa, sem passar pela lateral do modal. */
  window.KerdosPerfil = {
    abrir: function (aba) {
      const item = aba && document.querySelector('.mp-nav-item[data-tab="' + aba + '"]');
      if (item) item.click();
      openModal();
    }
  };

  document.getElementById('mp-close')?.addEventListener('click', closeModal);

  overlay?.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay?.classList.contains('active')) closeModal();
  });

  /* ══ TABS ══ */
  document.querySelectorAll('.mp-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.mp-nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.mp-tab').forEach(t => t.classList.add('hidden'));

      item.classList.add('active');
      document.getElementById('tab-' + item.dataset.tab)?.classList.remove('hidden');
      document.querySelector('.mp-body')?.scrollTo({ top: 0 });
    });
  });

  /* ══ TOGGLES — persistência ══ */
  document.querySelectorAll('.s-toggle-cb[data-key]').forEach(cb => {
    if (cb.disabled) {
      cb.checked = false;
      return;
    }
    const k = 'kerdos-' + cb.dataset.key;
    const saved = localStorage.getItem(k);
    if (saved !== null) cb.checked = saved === 'true';
    cb.addEventListener('change', () => {
      localStorage.setItem(k, cb.checked);
      if (cb.dataset.key === 'notif-plutos') {
        const u = getUserInfo();
        const uid = u.id || u.usuario_id || u.googleId;
        if (uid) {
          fetch(WEBHOOK_PERFIL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              usuario_id: uid,
              notif_plutos: cb.checked
            })
          }).catch(err => console.warn('Erro ao sincronizar notif-plutos:', err));
        }
      }
    });
  });

  /* ══ TOAST (glass) — type: 'success' (padrão) | 'error' ══ */
  const TOAST_ICONS = {
    success: '<polyline points="20 6 9 17 4 12"/>',
    error:   '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
  };
  function showToast(msg, type) {
    type = type === 'error' ? 'error' : 'success';
    let t = document.getElementById('kd-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'kd-toast';
      t.setAttribute('role', 'status');
      t.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"></svg><span></span>';
      document.body.appendChild(t);
    }
    t.className = 'kd-toast' + (type === 'error' ? ' is-error' : '');
    t.querySelector('svg').innerHTML = TOAST_ICONS[type];
    t.querySelector('span').textContent = msg;
    void t.offsetWidth;            /* reinicia a animação */
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3000);
  }

  /* O toast nasceu aqui dentro do IIFE, então ninguém fora deste arquivo
     conseguia chamá-lo — Voithos e router já tentavam (`window.showToast`)
     e caíam no fallback de alert(). Publicado para o app inteiro. */
  window.showToast = showToast;

  /* ══ SALVAR PERFIL ══ */
  const WEBHOOK_PERFIL = 'https://n8n.srv1495446.hstgr.cloud/webhook/perfil/atualizar';
  const WEBHOOK_SOBRE_MIM = 'https://n8n.srv1495446.hstgr.cloud/webhook/sobre-mim-onboarding';
  const SOBRE_KEY = 'kerdos-sobre-mim';

  /* Helper para obter dados do usuário logado */
  function getUserInfo() {
    try {
      if (typeof authState !== 'undefined' && authState.user) {
        return authState.user;
      }
      return JSON.parse(localStorage.getItem('kerdos_user') || 'null') || {};
    } catch (e) {
      return {};
    }
  }

  /* Consulta o "Sobre mim" no banco de dados via n8n */
  async function carregarSobreMimBD() {
    const aboutEl = document.getElementById('modal-input-about');
    if (!aboutEl) return;

    const u = getUserInfo();
    const email = u.email || '';
    const usuario_id = u.id || u.usuario_id || u.googleId || '';

    if (!email && !usuario_id) return;

    try {
      const url = `${WEBHOOK_SOBRE_MIM}?acao=obter&email=${encodeURIComponent(email)}&usuario_id=${encodeURIComponent(usuario_id)}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      const text = Array.isArray(data) ? (data[0]?.sobre_mim) : (data?.sobre_mim);

      if (typeof text === 'string') {
        aboutEl.value = text;
        try { localStorage.setItem(SOBRE_KEY, text); } catch (e) {}
        aboutEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (err) {
      console.warn('Falha ao carregar Sobre mim do banco de dados, mantendo valor local:', err);
    }
  }

  /* Pré-preenche "Sobre mim" com o que o usuário salvou antes */
  (function () {
    const aboutEl = document.getElementById('modal-input-about');
    if (!aboutEl) return;
    let saved = localStorage.getItem(SOBRE_KEY);
    if (saved === null) {
      try {
        const u = getUserInfo();
        if (u && typeof u.sobre_mim === 'string') saved = u.sobre_mim;
      } catch (e) {}
    }
    if (saved) aboutEl.value = saved;
    carregarSobreMimBD();
  })();

  /* ══ CONTADOR DE CARACTERES + BLOQUEIO ══ */
  (function () {
    function bind(inputId, counterId, max) {
      const el  = document.getElementById(inputId);
      const cnt = document.getElementById(counterId);
      if (!el || !cnt) return;

      function update() {
        /* Garante o limite mesmo em colagem/autofill */
        if (el.value.length > max) el.value = el.value.slice(0, max);
        const len = el.value.length;
        cnt.textContent = len + '/' + max;
        cnt.classList.toggle('is-full', len >= max);
      }
      el.addEventListener('input', update);
      update();
    }
    bind('modal-input-name',  'counter-name',  50);
    bind('modal-input-about', 'counter-about', 300);
  })();

  /* ══ FOTO DE PERFIL (base64 com compressão) ══ */
  const FOTO_KEY = 'kerdos-foto-perfil';
  let selectedPhoto = null;   /* base64 comprimido escolhido nesta sessão (null = não alterado) */

  /* Última foto aplicada — o lightbox abre a partir dela (o avatar usa
     background-image, então não dá para ler um src de <img>). */
  let fotoAtual = null;

  function applyAvatarPhoto(dataUrl) {
    fotoAtual = dataUrl || null;
    ['modal-av-big', 'modal-avatar', 'vt-sp-avatar', 'kp-perfil-avatar'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (dataUrl) {
        el.style.backgroundImage = 'url("' + dataUrl + '")';
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.color = 'transparent';
        el.classList.add('has-photo');
        el.textContent = '';
      } else {
        el.style.backgroundImage = '';
        el.style.backgroundSize = '';
        el.style.backgroundPosition = '';
        el.style.backgroundRepeat = '';
        el.style.color = '';
        el.classList.remove('has-photo');
      }
    });
  }

  /* Aplica foto salva ao carregar (localStorage ou vinda do banco via user.foto) */
  try {
    const u = getUserInfo();
    const savedFoto = localStorage.getItem(FOTO_KEY) || (u && u.foto);
    if (savedFoto) applyAvatarPhoto(savedFoto);
  } catch (e) {}

  /* ══ Lightbox da foto de perfil ══
     Clicar no avatar grande abre a foto em tamanho cheio. O overlay é
     criado sob demanda porque o markup do modal está duplicado em 5
     páginas — assim a feature nasce nas cinco sem editar nenhuma. */
  let lightbox = null;

  function abrirLightboxFoto() {
    if (!fotoAtual) return;

    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.className = 'mp-foto-lightbox';
      lightbox.innerHTML =
        '<button type="button" class="mp-foto-lightbox-close" aria-label="Fechar">&times;</button>' +
        '<img alt="Foto de perfil">';
      lightbox.addEventListener('click', e => {
        /* Fecha ao clicar no fundo ou no X, nunca na própria foto */
        if (e.target === lightbox || e.target.closest('.mp-foto-lightbox-close')) {
          fecharLightboxFoto();
        }
      });
      document.body.appendChild(lightbox);
    }

    lightbox.querySelector('img').src = fotoAtual;
    /* Um frame antes do .active para a transição de opacidade rodar */
    requestAnimationFrame(() => lightbox.classList.add('active'));
  }

  function fecharLightboxFoto() {
    lightbox?.classList.remove('active');
  }

  document.getElementById('modal-av-big')?.addEventListener('click', abrirLightboxFoto);

  /* Esc fecha primeiro o lightbox; o modal só fecha se ele não estiver aberto */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox?.classList.contains('active')) {
      e.stopImmediatePropagation();
      fecharLightboxFoto();
    }
  }, true);

  /* Redimensiona e comprime a foto em canvas para 256x256 (~20KB) */
  function comprimirImagem(file, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Crop quadrado centralizado para manter a proporção perfeita no círculo
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        callback(null, compressedDataUrl);
      };
      img.onerror = () => callback(new Error('Erro ao carregar imagem'));
      img.src = e.target.result;
    };
    reader.onerror = () => callback(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  }

  /* Preenche nome/e-mail do usuário logado nos campos do modal */
  (function () {
    const u = getUserInfo();
    if (!u || (!u.nome && !u.email)) return;

    const initial = u.nome ? u.nome.charAt(0).toUpperCase() : '?';

    const nameDisp = document.getElementById('modal-user-name');
    if (nameDisp) nameDisp.textContent = u.nome || '—';

    ['modal-avatar', 'modal-av-big', 'vt-sp-avatar', 'kp-perfil-avatar'].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el || el.classList.contains('has-photo')) return;
      el.textContent = initial;
    });

    const inputName = document.getElementById('modal-input-name');
    if (inputName && !inputName.value) inputName.value = u.nome || '';

    const inputEmail = document.getElementById('modal-input-email');
    if (inputEmail && !inputEmail.value) inputEmail.value = u.email || '';

    if (u.notif_plutos !== undefined && u.notif_plutos !== null) {
      const plutosCb = document.querySelector('.s-toggle-cb[data-key="notif-plutos"]');
      if (plutosCb) {
        plutosCb.checked = String(u.notif_plutos) === 'true';
        localStorage.setItem('kerdos-notif-plutos', plutosCb.checked);
      }
    }
  })();

  /* Botão "Alterar foto" → abre o seletor de arquivo */
  const photoBtn   = document.getElementById('btn-change-photo');
  const photoInput = document.getElementById('modal-input-photo');
  photoBtn?.addEventListener('click', () => photoInput?.click());

  photoInput?.addEventListener('change', function () {
    const file = this.files && this.files[0];
    if (!file) return;

    const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX   = 8 * 1024 * 1024;   /* Aceita até 8 MB e comprime para ~20 KB */

    if (TIPOS.indexOf(file.type) === -1) {
      showToast('Formato inválido. Use JPG, PNG ou WEBP.', 'error');
      this.value = '';
      return;
    }
    if (file.size > MAX) {
      showToast('Imagem muito grande. Máximo de 8 MB.', 'error');
      this.value = '';
      return;
    }

    comprimirImagem(file, function (err, compressedDataUrl) {
      if (err) {
        showToast('Não foi possível processar a imagem.', 'error');
        return;
      }
      selectedPhoto = compressedDataUrl;
      applyAvatarPhoto(selectedPhoto);
    });
    this.value = '';   /* permite reescolher o mesmo arquivo */
  });

  document.getElementById('btn-save-profile')?.addEventListener('click', async function () {
    const btn  = this;
    const orig = btn.textContent;

    const nameEl  = document.getElementById('modal-input-name');
    const emailEl = document.getElementById('modal-input-email');
    const aboutEl = document.getElementById('modal-input-about');

    /* Usuário atual (para e-mail/identificador) */
    const u = getUserInfo();

    const plutosToggle = document.querySelector('.s-toggle-cb[data-key="notif-plutos"]');
    const notifPlutos = plutosToggle ? plutosToggle.checked : (localStorage.getItem('kerdos-notif-plutos') !== 'false');

    const payload = {
      nome:         nameEl  ? nameEl.value.trim()  : '',
      sobre_mim:    aboutEl ? aboutEl.value.trim() : '',
      email:        emailEl ? emailEl.value.trim() : (u.email || ''),
      usuario_id:   u.id || u.usuario_id || u.googleId || null,
      foto:         selectedPhoto,  /* base64 data URL; null se não foi alterada */
      notif_plutos: notifPlutos
    };

    const payloadSobreMim = {
      acao:       'salvar',
      email:      payload.email,
      usuario_id: payload.usuario_id,
      sobre_mim:  payload.sobre_mim
    };

    btn.disabled    = true;
    btn.textContent = 'Salvando…';

    try {
      const [resPerfil] = await Promise.all([
        fetch(WEBHOOK_PERFIL, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload)
        }),
        fetch(WEBHOOK_SOBRE_MIM, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payloadSobreMim)
        }).then(res => {
          if (!res.ok) console.warn('WEBHOOK_SOBRE_MIM retornou HTTP ' + res.status);
          return res;
        }).catch(err => {
          console.warn('Erro ao salvar Sobre mim via n8n:', err);
          return null;
        })
      ]);

      if (!resPerfil.ok) throw new Error('HTTP ' + resPerfil.status);

      /* Persiste "Sobre mim" e a foto para reabrir já preenchidos */
      try { localStorage.setItem(SOBRE_KEY, payload.sobre_mim); } catch (e) {}
      try { if (selectedPhoto) localStorage.setItem(FOTO_KEY, selectedPhoto); } catch (e) {}

      /* Reflete o novo nome/descrição no estado local */
      try {
        if (typeof authState !== 'undefined' && authState.user) {
          authState.user.nome      = payload.nome;
          authState.user.sobre_mim = payload.sobre_mim;
          if (selectedPhoto) authState.user.foto = selectedPhoto;
          localStorage.setItem('kerdos_user', JSON.stringify(authState.user));
        }
      } catch (e) {}

      showToast('Dados salvos com sucesso!');

      btn.textContent      = 'Salvo ✓';
      btn.style.background  = 'var(--green)';
      btn.style.color       = '#fff';
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      btn.textContent      = 'Erro ao salvar';
      btn.style.background  = 'var(--danger)';
      btn.style.color       = '#fff';
    } finally {
      setTimeout(() => {
        btn.disabled         = false;
        btn.textContent      = orig;
        btn.style.background  = '';
        btn.style.color       = '';
      }, 2200);
    }
  });

  /* ══ BOTÃO UPGRADE ══ */
  document.querySelectorAll('.mp-upgrade-btn').forEach(btn => {
    btn.addEventListener('click', () => { location.href = 'planos.html'; });
  });

  /* ══ BOTÃO LOGOUT ══ */
  const mpSide = document.querySelector('.mp-side');
  if (mpSide) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id        = 'btn-logout';
    logoutBtn.className = 'mp-logout-btn';
    logoutBtn.type      = 'button';
    logoutBtn.setAttribute('aria-label', 'Sair da conta');
    logoutBtn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
        '<polyline points="16 17 21 12 16 7"/>' +
        '<line x1="21" y1="12" x2="9" y2="12"/>' +
      '</svg>' +
      '<span>Sair da conta</span>';

    mpSide.appendChild(logoutBtn);

    /* logout() de auth.js: remove kerdos_logged_in + kerdos_user → redireciona home.html */
    logoutBtn.addEventListener('click', () => logout());
  }

  /* ══ CURSOR PERSONALIZADO ══ */
  (function () {
    var cb = document.getElementById('toggle-cursor-custom');
    if (!cb) return;

    /* Init checkbox from kerdos_perfil_usuario (default: true) */
    try {
      var raw  = localStorage.getItem('kerdos_perfil_usuario');
      var pref = raw ? JSON.parse(raw) : {};
      cb.checked = pref.cursor_customizado !== false;
    } catch (e) { cb.checked = true; }

    cb.addEventListener('change', function () {
      /* Persist into kerdos_perfil_usuario */
      try {
        var raw  = localStorage.getItem('kerdos_perfil_usuario');
        var pref = raw ? JSON.parse(raw) : {};
        pref.cursor_customizado = cb.checked;
        localStorage.setItem('kerdos_perfil_usuario', JSON.stringify(pref));
      } catch (e) {}

      /* Apply immediately — window.kdCursor may be undefined on touch-only devices */
      if (window.kdCursor) {
        if (cb.checked) window.kdCursor.enable();
        else            window.kdCursor.disable();
      }
    });
  })();

  /* ══ SHA-256 Helper ══ */
  async function hashSenha(senha) {
    const encoder = new TextEncoder();
    const data = encoder.encode(senha);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ══ ALTERAR SENHA (Integração Real com n8n) ══ */
  const WEBHOOK_ALTERAR_SENHA = 'https://n8n.srv1495446.hstgr.cloud/webhook/alterar-senha';

  document.getElementById('mp-pwd-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const currentEl = document.getElementById('mp-pwd-current');
    const newEl     = document.getElementById('mp-pwd-new');
    const confirmEl = document.getElementById('mp-pwd-confirm');
    const err       = document.getElementById('mp-pwd-err');
    const btn       = this.querySelector('button[type="submit"]');

    const curPwd  = currentEl ? currentEl.value : '';
    const newPwd  = newEl ? newEl.value : '';
    const confPwd = confirmEl ? confirmEl.value : '';

    if (!curPwd) {
      if (err) { err.textContent = 'Informe a senha atual.'; err.style.display = 'block'; }
      return;
    }

    if (newPwd.length < 6) {
      if (err) { err.textContent = 'A nova senha precisa ter no mínimo 6 caracteres.'; err.style.display = 'block'; }
      return;
    }

    if (newPwd !== confPwd) {
      if (err) { err.textContent = 'As senhas não coincidem.'; err.style.display = 'block'; }
      return;
    }

    if (err) err.style.display = 'none';

    const origText = btn ? btn.textContent : 'Alterar senha';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Alterando…';
    }

    try {
      const u = getUserInfo();
      const senhaAtualHash = await hashSenha(curPwd);
      const novaSenhaHash  = await hashSenha(newPwd);

      const payload = {
        usuario_id: u.id || u.usuario_id || u.googleId || null,
        email: u.email || '',
        senha_atual: senhaAtualHash,
        nova_senha: novaSenhaHash
      };

      const res = await fetch(WEBHOOK_ALTERAR_SENHA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data;
      try { data = await res.json(); } catch (_) { data = {}; }
      if (Array.isArray(data)) data = data[0] || {};

      if (res.ok && data.sucesso) {
        if (btn) {
          btn.textContent = 'Senha alterada ✓';
          btn.style.background = 'var(--ok)';
          btn.style.color = 'var(--on-danger)';
        }
        showToast(data.mensagem || 'Senha alterada com sucesso!', 'success');
        this.reset();
      } else {
        const msg = data.mensagem || 'Erro ao alterar a senha. Tente novamente.';
        if (err) {
          err.textContent = msg;
          err.style.display = 'block';
        }
        showToast(msg, 'error');
        if (btn) {
          btn.textContent = 'Erro ao alterar';
          btn.style.background = 'var(--danger)';
          btn.style.color = 'var(--on-danger)';
        }
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      const msg = 'Erro de conexão. Verifique sua internet.';
      if (err) {
        err.textContent = msg;
        err.style.display = 'block';
      }
      showToast(msg, 'error');
      if (btn) {
        btn.textContent = 'Erro de conexão';
        btn.style.background = 'var(--danger)';
        btn.style.color = 'var(--on-danger)';
      }
    } finally {
      setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = origText;
          btn.style.background = '';
          btn.style.color = '';
        }
      }, 2500);
    }
  });

  /* ══ EXCLUIR HISTÓRICO DE CONVERSAS (Voithos) ══ */
  const WEBHOOK_EXCLUIR_CHATS = 'https://n8n.srv1495446.hstgr.cloud/webhook/excluir-historico-chat';

  document.querySelectorAll('#tab-privacidade .mp-btn-danger').forEach(btn => {
    btn.addEventListener('click', async function () {
      const confirmed = confirm('Tem certeza que deseja apagar todo o histórico de conversas com o Voithos? Esta ação é irreversível.');
      if (!confirmed) return;

      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Excluindo...';

      const u = getUserInfo();
      const uid = u.id || u.usuario_id || u.googleId || null;

      try {
        // 1. Exclusão remota no banco de dados
        if (uid) {
          const res = await fetch(WEBHOOK_EXCLUIR_CHATS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: uid })
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        }

        // 2. Limpeza de storage local
        try { localStorage.removeItem('kerdos_chats'); } catch (_) {}
        try { sessionStorage.removeItem('kerdos_chats'); } catch (_) {}

        // 3. Notificar instâncias ativas do Voithos para limpar estado em memória
        window.dispatchEvent(new CustomEvent('kerdos:clear-chats'));

        // 4. Limpeza visual na interface se presente
        const recentsList = document.getElementById('recents-list');
        if (recentsList) recentsList.innerHTML = '';

        const messagesEl = document.getElementById('vt-messages');
        if (messagesEl) messagesEl.innerHTML = '';

        const chatEl = document.getElementById('vt-chat');
        const welcomeEl = document.getElementById('vt-welcome');
        if (chatEl && chatEl.classList.contains('visible')) {
          chatEl.classList.remove('visible');
          if (welcomeEl) {
            welcomeEl.classList.remove('hidden');
            if (window.KerdosIntro && typeof window.KerdosIntro.play === 'function') {
              window.KerdosIntro.play(welcomeEl);
            }
          }
        }

        const chatInput = document.getElementById('chat-input');
        if (chatInput) chatInput.value = '';
        const welcomeInput = document.getElementById('welcome-input');
        if (welcomeInput) welcomeInput.value = '';

        const searchInput = document.getElementById('vt-search-input');
        if (searchInput) searchInput.value = '';
        const searchResults = document.getElementById('vt-search-results');
        if (searchResults) {
          searchResults.innerHTML = '<p class="vt-search-hint">Nenhuma conversa ainda</p>';
        }

        showToast('Histórico de conversas excluído com sucesso!');
      } catch (err) {
        console.error('Erro ao excluir histórico remoto/local:', err);
        showToast('Erro ao excluir histórico de conversas.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
      }
    });
  });

  /* ══ EXCLUIR CONTA ══ */
  const WEBHOOK_EXCLUIR_CONTA = 'https://n8n.srv1495446.hstgr.cloud/webhook/excluir-conta';

  let isExcluindoConta = false;

  document.querySelectorAll('#tab-conta .mp-btn-danger').forEach(btn => {
    btn.addEventListener('click', async function () {
      if (isExcluindoConta) return;

      const u = getUserInfo();
      const uid = u.id || u.usuario_id || u.googleId || null;
      const email = u.email || null;

      if (!uid && !email) {
        showToast('Sessão inválida ou expirada. Faça login novamente.', 'error');
        return;
      }

      const confirmed = confirm('ATENÇÃO: você está prestes a excluir permanentemente sua conta e todos os seus registros financeiros. Esta ação é irreversível. Tem certeza absoluta que deseja continuar?');
      if (!confirmed) return;

      isExcluindoConta = true;
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Excluindo conta...';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch(WEBHOOK_EXCLUIR_CONTA, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: uid, email: email }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        // Limpeza estrita de privacidade / LGPD (remove inclusive o e-mail lembrado)
        try {
          localStorage.removeItem('kerdos_remembered_email');
          localStorage.removeItem('kerdos-sobre-mim');
          localStorage.removeItem('kerdos-foto-perfil');
        } catch (_) {}

        if (typeof logout === 'function') {
          logout();
          try { localStorage.removeItem('kerdos_remembered_email'); } catch (_) {}
        } else {
          try {
            if (typeof clearUserData === 'function') {
              clearUserData();
            } else {
              localStorage.clear();
              sessionStorage.clear();
            }
            if (typeof authState !== 'undefined') {
              authState.isLoggedIn = false;
              authState.user = null;
              authState.onboardingComplete = false;
            }
            localStorage.removeItem('kerdos_remembered_email');
          } catch (_) {}
          window.location.replace('home.html');
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Erro ao excluir conta:', err);
        const isTimeout = err.name === 'AbortError';
        showToast(
          isTimeout
            ? 'Tempo limite esgotado ao contatar o servidor. Tente novamente.'
            : 'Erro ao processar exclusão da conta.',
          'error'
        );
        // Reabilita apenas em erro; no sucesso mantém desabilitado até a saída da página
        isExcluindoConta = false;
        btn.disabled = false;
        btn.textContent = origText;
      }
    });
  });

})();
