/* ═══════════════════════════════════════
   format.js — formatação numérica compartilhada
   Importar em TODAS as páginas que exibem valores,
   antes dos scripts que os renderizam
═══════════════════════════════════════ */

/* formatBRL(3428) → "R$ 3.428,00" · formatBRL(3428, { semCentavos: true }) → "R$ 3.428" */
function formatBRL(valor, opts) {
  var ocultar = !!(opts && opts.semCentavos) && Number.isInteger(Number(valor));
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: ocultar ? 0 : 2,
    maximumFractionDigits: ocultar ? 0 : 2
  }).format(valor);
}

/* formatNumero(1180) → "1.180" */
function formatNumero(valor) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(valor);
}

/* formatPercent(18) → "+18%" · formatPercent(-12.4) → "−12,4%" */
function formatPercent(valor) {
  var n = Number(valor);
  var corpo = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(Math.abs(n));
  return (n < 0 ? '−' : '+') + corpo + '%';
}

/* countUp(el, 3428, { duracao: 900, formatter: formatBRL, formatterOpts: { semCentavos: true }, valorInicial: 0 })
   Anima o texto de `el` até valorFinal com ease-out, formatando a cada frame.
   Com prefers-reduced-motion ativo, seta o valor final direto. */
function countUp(el, valorFinal, opts) {
  opts = opts || {};
  var formatter = opts.formatter || formatNumero;
  var aplicar = function (v) { el.textContent = formatter(v, opts.formatterOpts); };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    aplicar(valorFinal);
    return;
  }

  var duracao = opts.duracao || 900;
  var inicio  = opts.valorInicial || 0;
  var inteiro = Number.isInteger(Number(valorFinal));
  var t0 = null;

  function passo(t) {
    if (t0 === null) t0 = t;
    var p = Math.min((t - t0) / duracao, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    var v = inicio + (valorFinal - inicio) * eased;
    aplicar(p < 1 && inteiro ? Math.round(v) : (p < 1 ? v : valorFinal));
    if (p < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

/* Camada declarativa: formata elementos marcados com data-attributes.
   [data-brl="3428"] · [data-numero="142"] · [data-percent="18"]
   Modificadores: [data-sem-centavos] (BRL inteiro sem ,00) · [data-countup] (anima na carga) */
function aplicarFormatacao(root) {
  var els = (root || document).querySelectorAll('[data-brl], [data-numero], [data-percent]');
  els.forEach(function (el) {
    var valor, formatter, fmtOpts;
    if (el.hasAttribute('data-brl')) {
      valor = parseFloat(el.getAttribute('data-brl'));
      formatter = formatBRL;
      fmtOpts = { semCentavos: el.hasAttribute('data-sem-centavos') };
    } else if (el.hasAttribute('data-numero')) {
      valor = parseFloat(el.getAttribute('data-numero'));
      formatter = formatNumero;
    } else {
      valor = parseFloat(el.getAttribute('data-percent'));
      formatter = formatPercent;
    }
    if (isNaN(valor)) return;
    if (el.hasAttribute('data-countup')) {
      countUp(el, valor, { formatter: formatter, formatterOpts: fmtOpts });
    } else {
      el.textContent = formatter(valor, fmtOpts);
    }
  });
}

document.addEventListener('DOMContentLoaded', function () { aplicarFormatacao(); });

window.KerdosFormat = {
  formatBRL: formatBRL,
  formatNumero: formatNumero,
  formatPercent: formatPercent,
  countUp: countUp,
  aplicarFormatacao: aplicarFormatacao
};
