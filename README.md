# HMAC Lab

Laboratório didático e interativo de HMAC (Hash-based Message Authentication Code, RFC 2104),
construído com React + Vite + TypeScript. Todo o cálculo roda localmente no navegador —
WebCrypto para SHA-1/256/384/512 e implementação TypeScript própria para MD5 (didático).
Nenhum dado sai da máquina.

## Executar

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # build de produção em dist/
```

## O que dá para fazer

- **Calcular HMAC** — escolha o algoritmo (HMAC-SHA-256/384/512, HMAC-SHA-1, HMAC-MD5),
  informe chave e mensagem em texto/hex/base64, gere chaves aleatórias, veja o medidor de
  força e o **pipeline interno passo a passo**: normalização da chave K₀, XOR com ipad
  (0x36) e opad (0x5c), buffers concatenados, hash interno e MAC final — com saída em
  hex, base64 e base64url. Inclui vetores de teste das RFCs 2202/4231 para conferência.
- **Verificar** — cole o MAC recebido (hex/base64 autodetectado), recalcule e compare
  byte a byte com destaque da primeira divergência, checklist didático (tamanho, encoding,
  comparação em tempo constante, canonização, freshness).
- **Diagrama de Sequência** — 6 cenários renderizados em SVG: provisionamento/distribuição
  de chave, requisição de API assinada (estilo AWS SigV4), webhook verificado
  (GitHub/Stripe), JWT HS256, mensagem adulterada e replay attack — cada um com passo a
  passo explicado.
- **Aprender** — a fórmula, por que `H(K∥m)` falha (length extension), como funcionam
  ipad/opad, tabela de algoritmos, onde o HMAC aparece e boas práticas.

## SEO, Analytics e Ads

- Cada aba tem URL própria (`/`, `/verificar`, `/sequencia`, `/aprender`) com `title`,
  `meta description` e `canonical` dinâmicos, Open Graph, Twitter Cards, JSON-LD,
  `public/robots.txt` e `public/sitemap.xml`.
- Google Analytics 4 (`G-MRDTQXT5RY`): `page_view` disparado a cada troca de aba, mais
  eventos `tab_view`, `select_content` (cenário do diagrama) e `hmac_verify`.
- Google AdSense (`ca-pub-1710447158146560`) no rodapé — configure o slot real em
  `src/components/AdUnit.tsx` ou use anúncios automáticos.

**Antes do deploy**, substitua o domínio placeholder `https://hmac-lab.example.com` em
`index.html`, `public/robots.txt` e `public/sitemap.xml` — ou defina `VITE_SITE_URL` no
build (o canonical segue a variável; os arquivos estáticos precisam ser editados).
Em hospedagem estática, configure fallback para `index.html` (SPA) nas rotas.

## Deploy (GitHub Pages)

O workflow `.github/workflows/deploy.yml` compila o site a cada push na `main` e publica
o conteúdo de `dist/` no branch **`gh-pages`** (via `peaceiris/actions-gh-pages`).
Ele já ajusta `VITE_BASE_PATH`, canonical/OG, `sitemap.xml` e `robots.txt` para
`https://<owner>.github.io/<repo>` e gera `404.html` para suportar deep links da SPA.

Para ativar, após o primeiro deploy:

1. No GitHub: **Settings → Pages**
2. Em **Source**, escolha **Deploy from a branch**
3. Selecione o branch **`gh-pages`**, pasta **`/ (root)`** e salve
