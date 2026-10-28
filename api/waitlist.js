/* ════════════════════════════════════════════════════════════
   api/waitlist.js — Vercel Serverless Function (Kerdos Finance)

   Recebe os leads do formulário de Lista de Espera da Landing Page,
   aplica validações de segurança (Honeypot, Rate Limit por IP,
   sanitização de tamanho/formato e whitelist de interesses) e
   encaminha para o Webhook privado do n8n via Header Secreto.
   Zero exposição do domínio da VPS/n8n no navegador.
════════════════════════════════════════════════════════════ */

const LIMITES = { nome: 120, email: 160 };
const INTERESSES_VALIDOS = new Set(['voithos', 'argos', 'plutos']);

/* Rate Limiting em memória por instância Serverless (máx 4 envios / 10 min por IP) */
const JANELA_MS = 10 * 60 * 1000;
const MAX_TENTATIVAS = 4;
const rateLimitMap = new Map();

function limparRateLimitAntigo(agora) {
  if (rateLimitMap.size > 2000) {
    for (const [ip, reg] of rateLimitMap.entries()) {
      if (agora - reg.inicio > JANELA_MS) rateLimitMap.delete(ip);
    }
  }
}

function checarRateLimit(ip) {
  const agora = Date.now();
  limparRateLimitAntigo(agora);
  const atual = rateLimitMap.get(ip);
  if (!atual || agora - atual.inicio > JANELA_MS) {
    rateLimitMap.set(ip, { count: 1, inicio: agora });
    return true;
  }
  if (atual.count >= MAX_TENTATIVAS) {
    return false;
  }
  atual.count += 1;
  return true;
}

module.exports = async function handler(req, res) {
  /* Headers básicos de segurança */
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método não permitido.' });
  }

  /* Identificação do IP real na Vercel */
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket?.remoteAddress || 'unknown').trim();

  if (!checarRateLimit(ip)) {
    return res.status(429).json({
      ok: false,
      error: 'Muitas tentativas em sequência. Aguarde alguns minutos.'
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {
      return res.status(400).json({ ok: false, error: 'JSON inválido.' });
    }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Payload ausente.' });
  }

  /* 1. Checagem de Honeypot (campo "site" deve vir sempre vazio) */
  if (body.site && String(body.site).trim() !== '') {
    /* Finge sucesso para o bot não detectar o bloqueio */
    return res.status(200).json({ ok: true });
  }

  /* 2. Sanitização e Validação estrita no servidor */
  const nome = String(body.nome || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '')
    .slice(0, LIMITES.nome);

  const telefone = String(body.telefone || '').replace(/\D/g, '');

  const email = String(body.email || '')
    .trim()
    .toLowerCase()
    .slice(0, LIMITES.email);

  const interessesBrutos = Array.isArray(body.interesses) ? body.interesses : [];
  const interesses = Array.from(
    new Set(
      interessesBrutos
        .map((v) => String(v).toLowerCase().trim())
        .filter((v) => INTERESSES_VALIDOS.has(v))
    )
  );

  if (nome.length < 3 || nome.indexOf(' ') === -1) {
    return res.status(400).json({ ok: false, error: 'Informe nome e sobrenome válidos.' });
  }
  if (!/^[1-9]{2}9?\d{8}$/.test(telefone)) {
    return res.status(400).json({ ok: false, error: 'Telefone inválido. Use DDD + número.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'E-mail inválido.' });
  }
  if (interesses.length === 0) {
    return res.status(400).json({ ok: false, error: 'Selecione ao menos um interesse.' });
  }

  /* 3. Encaminhamento seguro para o Webhook do n8n */
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const secretKey = process.env.N8N_SECRET_KEY;

  if (!webhookUrl) {
    console.error('[waitlist] Variável N8N_WEBHOOK_URL não configurada na Vercel.');
    return res.status(503).json({ ok: false, error: 'Serviço temporariamente indisponível.' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Kerdos-Landing-Vercel/1.0'
  };
  if (secretKey) {
    headers['x-kerdos-secret'] = secretKey;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        nome,
        telefone: '55' + telefone,
        email,
        interesses
      }),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!n8nRes.ok) {
      console.error('[waitlist] Erro ao enviar ao n8n:', n8nRes.status);
      return res.status(502).json({ ok: false, error: 'Falha ao registrar inscrição.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[waitlist] Exceção na chamada ao n8n:', err.message);
    return res.status(502).json({ ok: false, error: 'Não foi possível conectar ao servidor.' });
  }
};
