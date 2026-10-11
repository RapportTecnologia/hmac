import { useEffect, useRef } from 'react'

/**
 * Slot do bloco de anúncios criado no painel do AdSense
 * (Anúncios → Por bloco de anúncios → Display). Substitua pelo ID real —
 * sem um slot válido o Google não serve anúncios neste bloco.
 * Alternativa sem slot: ativar "Anúncios automáticos" no painel.
 */
export const ADSENSE_SLOT = '0000000000'
export const ADSENSE_CLIENT = 'ca-pub-1710447158146560'

export function AdUnit({ slot = ADSENSE_SLOT }: { slot?: string }) {
  const ref = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    const ins = ref.current
    if (!ins || pushed.current || ins.dataset.adsbygoogleStatus === 'done') return
    pushed.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      /* script do AdSense ainda não carregou ou foi bloqueado */
    }
  }, [])

  return (
    <ins
      ref={ref}
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
