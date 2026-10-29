# Kerdos Finance · Landing Page

> Suas finanças, por conversa.

Landing page de pré-lançamento da **Kerdos Finance**, um assistente financeiro pessoal que funciona pelo WhatsApp: você manda uma mensagem dizendo quanto gastou e a Kerdos anota, organiza e avisa quando o mês começa a sair do trilho.

🌐 **Site:** [kerdos.com.br](https://kerdos.com.br)

---

## 🚧 Projeto futuro

Esta landing é a porta de entrada de um **projeto que ainda está em construção**. O produto não foi lançado: por enquanto, o site apresenta a proposta e coleta interessados em uma **lista de espera**.

O que vem por aí são três agentes:

| Agente | Função |
| --- | --- |
| **Voithos** | Dia a dia: registra gastos por texto, áudio, foto ou PDF e categoriza sozinho. |
| **Argos** | Análise: acompanha seus padrões e avisa quando algo sai da curva. |
| **Plutos** | Educação: trilha para aprender o básico de investimentos antes de investir. |

---

## Stack

- HTML, CSS e JavaScript puros (sem framework, sem build)
- [Vercel](https://vercel.com) para hospedagem e função serverless
- [n8n](https://n8n.io) recebendo os cadastros da lista de espera

## Estrutura

```
├── index.html          # redireciona para pages/home.html
├── pages/home.html     # a landing
├── styles/             # CSS (core + componentes)
├── scripts/            # JS (core + componentes)
├── assets/             # fontes, ícones e imagens
├── api/waitlist.js     # função serverless da lista de espera
└── vercel.json         # headers de segurança
```

## Rodando localmente

Não precisa instalar nada. Basta servir a pasta:

```bash
npx serve .
```

Para testar também a lista de espera (`/api/waitlist`), use a CLI da Vercel:

```bash
npx vercel dev
```

---

Feito por **Davi Freitas**.
