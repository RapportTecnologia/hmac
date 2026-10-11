export type Tab = 'learn' | 'compute' | 'verify' | 'sequence'

export interface RouteInfo {
  path: string
  title: string
  description: string
}

/** URL base canônica do site — sobrescreva com VITE_SITE_URL no deploy. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://hmac-lab.example.com').replace(/\/$/, '')

export const ROUTES: Record<Tab, RouteInfo> = {
  learn: {
    path: '/aprender',
    title: 'Aprender HMAC — conceitos, fórmula e usos | HMAC Lab',
    description:
      'Guia didático de HMAC (RFC 2104): a fórmula H((K⊕opad)∥H((K⊕ipad)∥m)), por que H(K∥m) é inseguro (extensão de comprimento), algoritmos típicos e boas práticas de chave e verificação.',
  },
  compute: {
    path: '/',
    title: 'Calcular HMAC — SHA-256, SHA-512, SHA-1, MD5 | HMAC Lab',
    description:
      'Calcule códigos de autenticação de mensagem HMAC no navegador: escolha o algoritmo, informe chave e mensagem em texto, hex ou base64 e veja cada etapa interna do pipeline (K0, ipad, opad, hashes aninhados).',
  },
  verify: {
    path: '/verificar',
    title: 'Verificar HMAC — validar assinaturas e MACs | HMAC Lab',
    description:
      'Verifique um MAC recebido: informe a chave, a mensagem e o MAC em hex ou base64, recalcule o HMAC e compare byte a byte com comparação em tempo constante e checklist didático.',
  },
  sequence: {
    path: '/sequencia',
    title: 'Diagramas de sequência HMAC — webhooks, APIs assinadas, JWT | HMAC Lab',
    description:
      'Diagramas de sequência de comunicações autenticadas com HMAC: provisionamento de chave, requisições de API assinadas, verificação de webhooks, JWT HS256, replay attack e mensagem adulterada.',
  },
}

const PATH_TO_TAB: Record<string, Tab> = {
  ...Object.fromEntries((Object.entries(ROUTES) as [Tab, RouteInfo][]).map(([t, r]) => [r.path, t])),
  '/calcular': 'compute', // alias amigável
  '/diagramas': 'sequence', // alias amigável
}

/** Prefixo do deploy (ex.: '' em dev, '/HMAC' no GitHub Pages). */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

/** A raiz abre direto na calculadora de HMAC. */
export function pathToTab(pathname: string): Tab {
  let p = pathname
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length)
  if (p === '/' || p === '') return 'compute'
  return PATH_TO_TAB[p.replace(/\/$/, '')] ?? 'compute'
}

export function tabToPath(tab: Tab): string {
  return `${BASE}${ROUTES[tab].path}`
}
