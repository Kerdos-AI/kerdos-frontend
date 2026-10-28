/* ═══════════════════════════════════════
   auth.js — estado de autenticação global
   Importar em TODAS as páginas, no <head>

   Este arquivo NÃO monta nem esconde itens da navbar. Quem decide o
   que aparece é a classe auth-logado / auth-visitante em <html>,
   gravada pelo script inline no topo do <head> de cada página —
   antes de qualquer CSS, portanto antes da primeira pintura. Aqui a
   classe só é ressincronizada quando o estado muda em runtime.
═══════════════════════════════════════ */

var authState = (function () {
  var userRaw = localStorage.getItem('kerdos_user');
  var user    = null;

  try { user = userRaw ? JSON.parse(userRaw) : null; } catch(e) {}

  var loggedIn = localStorage.getItem('kerdos_logged_in') === 'true' && user !== null;

  // onboardingComplete vem SEMPRE do objeto user salvo (que veio do banco no login)
  // Nunca de uma chave separada no localStorage
  var onboardingComplete = false;
  if (loggedIn && user) {
    var val = user.onboarding_completo;
    onboardingComplete = (val === true || val === 'true');
  }

  return {
    isLoggedIn:         loggedIn,
    user:               user,
    onboardingComplete: onboardingComplete
  };
})();

/* Chamado após o webhook de login retornar com sucesso */
function login(userData) {
  // Normaliza o booleano independente do n8n retornar true ou "true"
  userData.onboarding_completo = (userData.onboarding_completo === true || userData.onboarding_completo === 'true');

  authState.isLoggedIn         = true;
  authState.user               = userData;
  authState.onboardingComplete = userData.onboarding_completo;

  // Salva só o user — é a única fonte de verdade
  localStorage.setItem('kerdos_logged_in', 'true');
  localStorage.setItem('kerdos_user', JSON.stringify(userData));

  // Remove a chave antiga pra não causar conflito
  localStorage.removeItem('kerdos_onboarding_complete');

  applyAuthState();
}

/* Limpa todos os dados de usuário, chats, transações e estado do storage */
function clearUserData() {
  // Preserva preferências de interface/dispositivo que não pertencem à sessão do usuário
  var theme           = localStorage.getItem('kerdos-theme');
  var themeV2         = localStorage.getItem('kerdos-theme-v2');
  var rememberedEmail = localStorage.getItem('kerdos_remembered_email');

  // Limpa completamente todos os dados de usuário, chats, transações e caches locais
  localStorage.clear();
  try { sessionStorage.clear(); } catch (e) {}

  // Restaura o tema e e-mail lembrado (se houver)
  if (theme)           localStorage.setItem('kerdos-theme', theme);
  if (themeV2)         localStorage.setItem('kerdos-theme-v2', themeV2);
  if (rememberedEmail) localStorage.setItem('kerdos_remembered_email', rememberedEmail);
}

function logout() {
  authState.isLoggedIn         = false;
  authState.user               = null;
  authState.onboardingComplete = false;

  clearUserData();
  applyAuthState();

  window.location.replace('home.html');
}

/* Chamado ao final do onboarding — atualiza o user em memória e no localStorage */
function setOnboardingComplete() {
  authState.onboardingComplete = true;

  if (authState.user) {
    authState.user.onboarding_completo = true;
    localStorage.setItem('kerdos_user', JSON.stringify(authState.user));
  }
}

/* Ressincroniza a classe do <html> com o estado em memória.
   Sem timer, sem rede: só o toggle. */
function applyAuthState() {
  var raiz = document.documentElement;
  raiz.classList.toggle('auth-logado',    authState.isLoggedIn);
  raiz.classList.toggle('auth-visitante', !authState.isLoggedIn);
}

/* Página protegida — redireciona se não estiver logado ou sem onboarding */
function requireAuth() {
  if (!authState.isLoggedIn) {
    window.location.replace('login.html');
    return;
  }
  var naOnboarding = window.location.pathname.includes('onboarding');
  if (!authState.onboardingComplete && !naOnboarding) {
    window.location.replace('onboarding.html');
  }
}

/* Página de login/registro — redireciona quem já está logado */
function requireGuest() {
  if (!authState.isLoggedIn) return;
  window.location.replace(authState.onboardingComplete ? 'app.html#voithos' : 'onboarding.html');
}

/* Roda agora, ainda no <head>: o documentElement já existe e a
   correção acontece antes da primeira pintura. Esperar o
   DOMContentLoaded era a causa do flash de estado deslogado. */
applyAuthState();