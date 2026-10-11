import { useCallback, useEffect, useState } from 'react'
import { AdUnit } from './components/AdUnit'
import { ROUTES, SITE_URL, pathToTab, tabToPath, type Tab } from './lib/routing'
import { ComputeTab } from './tabs/ComputeTab'
import { LearnTab } from './tabs/LearnTab'
import { SequenceTab } from './tabs/SequenceTab'
import { VerifyTab } from './tabs/VerifyTab'

const TABS: { id: Tab; label: string }[] = [
  { id: 'compute', label: 'Calcular HMAC' },
  { id: 'verify', label: 'Verificar' },
  { id: 'sequence', label: 'Diagrama de Sequência' },
  { id: 'learn', label: 'Aprender' },
]

/** Atualiza title/meta/canonical e dispara page_view (GA4) conforme a rota ativa. */
function useRouteSeo(tab: Tab) {
  useEffect(() => {
    const route = ROUTES[tab]
    document.title = route.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', route.description)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${SITE_URL}${route.path}`)
    window.gtag?.('event', 'page_view', {
      page_title: route.title,
      page_location: `${SITE_URL}${route.path}`,
      page_path: `${import.meta.env.BASE_URL.replace(/\/$/, '')}${route.path}`,
    })
    window.gtag?.('event', 'tab_view', {
      event_category: 'navigation',
      tab_id: tab,
    })
  }, [tab])
}

export default function App() {
  const [tab, setTabState] = useState<Tab>(() => pathToTab(window.location.pathname))

  const setTab = useCallback((t: Tab) => {
    setTabState(t)
    window.history.pushState({ tab: t }, '', tabToPath(t))
  }, [])

  useEffect(() => {
    const onPop = () => setTabState(pathToTab(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useRouteSeo(tab)

  return (
    <>
      <header className="topbar">
        <div className="brandline">
          <h1>
            HMAC Lab
            <span className="by">
              {' '}— por <a href="https://rapport.tec.br" target="_blank" rel="noreferrer">Rapport Tecnologia</a>
            </span>
          </h1>
        </div>
        <p className="subtitle">
          Laboratório didático de HMAC (RFC 2104) — calcule e verifique códigos de autenticação de
          mensagem, visualize o pipeline interno e explore cenários reais em diagramas de sequência.
          Tudo roda localmente no navegador (WebCrypto + TypeScript); nada sai da sua máquina.
        </p>
        <nav className="tabs" aria-label="Ferramentas">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {tab === 'compute' && <ComputeTab />}
        {tab === 'verify' && <VerifyTab />}
        {tab === 'sequence' && <SequenceTab />}
        {tab === 'learn' && <LearnTab />}
      </main>
      <footer className="app-footer">
        <div className="ad-wrap" aria-label="Publicidade">
          <AdUnit />
        </div>
        HMAC Lab · referências:{' '}
        <a href="https://www.rfc-editor.org/rfc/rfc2104" target="_blank" rel="noreferrer">RFC 2104 (HMAC)</a>,{' '}
        <a href="https://www.rfc-editor.org/rfc/rfc4231" target="_blank" rel="noreferrer">4231 (testes SHA-2)</a>,{' '}
        <a href="https://csrc.nist.gov/pubs/fips/198-1/final" target="_blank" rel="noreferrer">FIPS 198-1</a>
        {' '}· um projeto <a href="https://rapport.tec.br" target="_blank" rel="noreferrer">Rapport Tecnologia</a>
      </footer>
    </>
  )
}
