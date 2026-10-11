# Requisitos — HMAC Lab

Laboratório web estático (SPA) para aprender e experimentar HMAC, no padrão dos demais
labs Rapport (JWT Lab). Frontend-only: nenhum backend, nenhum dado sai do navegador.

## Funcionais

- **F1 — Calculadora de HMAC**: usuário escolhe algoritmo, chave (texto/hex/base64) e
  mensagem (texto/hex/base64) e obtém o MAC em hex, base64 e base64url.
- **F2 — Algoritmos típicos**: HMAC-SHA-256, HMAC-SHA-384, HMAC-SHA-512 (recomendados),
  HMAC-SHA-1 (legado) e HMAC-MD5 (inseguro, apenas didático, via implementação local).
- **F3 — Pipeline didático**: exibir etapas internas do RFC 2104 — K₀ (normalização da
  chave ao bloco B), K₀⊕ipad, buffer interno, hash interno, K₀⊕opad, buffer externo e MAC.
- **F4 — Geração e força de chave**: gerar chave aleatória do tamanho do digest e medidor
  de força (bits vs tamanho do digest); aviso quando a chave excede o bloco B.
- **F5 — Vetores de teste**: presets das RFCs 2202/4231 para conferência de resultados.
- **F6 — Verificação**: recalcular e comparar MAC recebido (hex/base64 autodetectado)
  com destaque da primeira divergência; checklist didático (tamanho, encoding,
  tempo constante, canonização, freshness).
- **F7 — Diagramas de sequência**: cenários renderizados em SVG (sem dependência externa):
  distribuição de chave, API assinada, webhook verificado, JWT HS256, mensagem adulterada
  e replay attack; cada cenário com passo a passo e ideia central.
- **F8 — Conteúdo didático**: aba "Aprender" com fórmula, length-extension, ipad/opad,
  tabela de algoritmos, usos reais e boas práticas.

## Não funcionais

- **N1 — Stack**: React 19 + Vite 8 + TypeScript estrito; sem dependências de runtime além
  de react/react-dom.
- **N2 — Privacidade**: 100% client-side (WebCrypto + TS puro); sem chamadas de rede além
  de GA4/AdSense.
- **N3 — SEO**: rotas por aba (`/`, `/verificar`, `/sequencia`, `/aprender`) com title,
  description e canonical dinâmicos; OG/Twitter/JSON-LD; sitemap.xml e robots.txt.
- **N4 — Analytics**: gtag `G-MRDTQXT5RY` com page_view por aba; eventos `tab_view`,
  `select_content` (cenário) e `hmac_verify`.
- **N5 — Ads**: AdSense `ca-pub-1710447158146560` no rodapé via bloco display.
- **N6 — Visual**: paleta Rapport (slate-950/900/800 + laranja brand), layout de abas com
  cards, denso e legível, responsivo (breakpoint ~1100px).
- **N7 — Deploy**: GitHub Pages via workflow (dist → gh-pages), com `VITE_BASE_PATH` e
  `VITE_SITE_URL` parametrizáveis; 404.html para deep links da SPA.

## Critérios de aceite

- MACs conferem com os vetores oficiais: RFC 4231 TC1 (`b0344c61…`), TC2 (`5bdcc146…`),
  TC3 (`773ea91e…`) para SHA-256; RFC 2202 para MD5/SHA-1.
- Trocar de aba altera URL, título e dispara `page_view` no GA4.
- Verificação com MAC correto → "válido"; com 1 byte alterado → "inválido" + índice da
  divergência.
- Todos os cenários de sequência renderizam sem scroll vertical excessivo em desktop.
