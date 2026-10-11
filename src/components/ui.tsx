import { useState, type ReactNode } from 'react'

export function Callout({ kind, title, children }: { kind: 'info' | 'warn' | 'danger' | 'ok'; title: string; children: ReactNode }) {
  return (
    <div className={`callout ${kind}`}>
      <span className="t">{title}</span>
      {children}
    </div>
  )
}

export function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="btn small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          /* clipboard indisponível */
        }
      }}
    >
      {copied ? 'Copiado!' : label}
    </button>
  )
}

export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg-ctrl">
      {options.map((o) => (
        <button key={o.value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Renderização hex agrupada por bytes com a última parte destacável. */
export function HexView({ bytes, color, maxLen = 256 }: { bytes: Uint8Array; color?: string; maxLen?: number }) {
  const hex = [...bytes.slice(0, maxLen)].map((b) => b.toString(16).padStart(2, '0')).join(' ')
  const truncated = bytes.length > maxLen
  return (
    <span className="hex" style={color ? { color } : undefined}>
      {hex}
      {truncated ? ` … (+${bytes.length - maxLen} bytes)` : ''}
      <span className="muted"> · {bytes.length}B</span>
    </span>
  )
}
