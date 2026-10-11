import type { ReactNode } from 'react'

const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`)/g

/** Renderiza negrito (**..**) e código (`..`) inline, sem innerHTML. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(TOKEN)
  const nodes: ReactNode[] = parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>
    return p
  })
  return <>{nodes}</>
}
