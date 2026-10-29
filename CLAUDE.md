# CLAUDE.md — Kerdos Finance · Landing

Landing page de pré-lançamento da Kerdos Finance (assistente financeiro por WhatsApp). O produto **ainda não existe**: a página vende a ideia e coleta uma lista de espera. Esta landing é a base de um projeto futuro, então mantenha o código simples e fácil de evoluir.

Responda e escreva comentários **em português**.

## Stack

- HTML, CSS e JavaScript **puros**. Sem framework, sem bundler, sem `package.json`, sem build.
- Hospedagem na **Vercel**. A única parte de backend é `api/waitlist.js` (função serverless).
- Lista de espera: `api/waitlist.js` → webhook do **n8n** (env vars `N8N_WEBHOOK_URL` e `N8N_SECRET_KEY`, configuradas na Vercel e nunca no código).

Não adicione dependências, frameworks ou etapas de build sem pedir.

## Rodando

```bash
npx serve .        # só a página
npx vercel dev     # página + /api/waitlist
```

Não há testes automatizados. Para validar uma mudança visual, abra a página no navegador (desktop **e** mobile ~375px).

## Mapa

| Caminho | O que é |
| --- | --- |
| `index.html` | **A landing inteira** (~880 linhas), servida na raiz (`kerdos.com.br/`). Seções: hero, `#como-funciona`, `#security-section`, `#quem-somos` (equipe), `#comecar` (CTA final). Tem um `<script>` inline no fim (navbar, scroll reveal, typewriter). |
| `styles/core/theme.css` | **Fonte única de cor.** Primeira folha de estilo carregada. |
| `styles/core/style.css` | Estilos gerais da página. |
| `styles/core/scrollbar.css` | Scrollbar dourada. Carregada **por último**. |
| `styles/components/*.css` | `navbar.css`, `lista-espera.css` (prefixo `le-`). |
| `scripts/core/format.js` | `formatBRL()` e renderização de `[data-brl]`, `[data-numero]`, `[data-percent]`. |
| `scripts/components/*.js` | `lista-espera.js` (popup), `how-it-works.js` (animações dos cards), `swipe.js` (gesto mobile), `cursor.js`, `app-loader.js`. |
| `api/waitlist.js` | Validação, honeypot, rate limit e proxy para o n8n. |
| `llms.txt`, `robots.txt`, `sitemap.xml` | SEO e descrição para LLMs. |
| `vercel.json` | Headers de segurança, redirect 308 das URLs antigas (`/pages/*`, `/home.html`) para `/` e cache de 7 dias em `/assets/`. |

## Regras do projeto

### Cores e tema
- **Nenhuma cor literal fora de `theme.css`.** Use só `var(--token)` (ex.: `--surface-1`, `--ink-2`, `--brand`, `--line`).
- Precisa de uma cor nova? Crie o token em `theme.css` (camada 3, semântica), não um hex no componente.
- Tema **único, escuro** (preto e dourado). Não existe modo claro; não crie um.

### Tipografia
- Fonte do site: **Space Grotesk** (via `<link>` do Google Fonts no `<head>`). Não use `@import`.
- **SF Pro Display** é usada só dentro do mockup do celular (`.device-screen`). Os `.woff2` estão recortados para Latin; um caractere novo no mockup exige refazer o subset.

### JavaScript
- Vanilla JS, padrão IIFE com `'use strict'`. Nada de libs externas.
- Respeite `prefers-reduced-motion` em toda animação nova.
- Efeitos de hover/cursor só em `(hover: hover) and (pointer: fine)`.
- **Nunca** use `innerHTML` com dado digitado pelo usuário. Use `textContent`.
- Valores em reais: use `formatBRL()` ou o atributo `data-brl`, nunca formate na mão.

### Lista de espera
- Qualquer elemento com `[data-lista-espera]` abre o popup.
- Interesses válidos: `voithos`, `argos`, `plutos`. Se mudar, atualize **o front e `INTERESSES_VALIDOS` em `api/waitlist.js`**.
- A validação do front é conforto; a segurança está no `api/waitlist.js`. Não exponha a URL do n8n no navegador.

### SEO
- A URL canônica `https://kerdos.com.br/` aparece em `index.html` (canonical, `og:url`, JSON-LD), `sitemap.xml` e `llms.txt`. Se mudar uma, mude todas.
- Ao alterar o conteúdo da página, atualize o `lastmod` do `sitemap.xml` e, se for o caso, o `llms.txt`.
- O JSON-LD em `index.html` descreve só o que existe. Não invente preço, avaliação ou recurso lançado.

### Copy
- Português do Brasil, tom direto e próximo. O produto está em **pré-lançamento**: nada de "cadastre-se", "faça login" ou "assine". O CTA é sempre a lista de espera.
- Os três agentes: **Voithos** (registro do dia a dia), **Argos** (análise e alertas), **Plutos** (educação financeira). Plutos ensina; não recomenda compra ou venda de ativos.

### Mobile
- Toda mudança precisa funcionar em ~375px, sem scroll horizontal. Os breakpoints mais usados em `style.css` são 768px e 600px.

## Armadilhas conhecidas

- O comentário de `app-loader.js` cita `app.html`, `intro.js` e outras páginas que **não existem neste repo** (herança do app). Não procure por elas.
- `.playwright-mcp/` é lixo de sessões de teste. Não versione.
- `index.html` é grande: leia por trechos (`offset`/`limit`) ou busque pelo `id` da seção em vez de abrir o arquivo inteiro.

## Git

- Commits em português ou no formato `feat:` / `fix:` / `refactor(escopo):`, como no histórico.
- Faça commit só quando pedirem.
