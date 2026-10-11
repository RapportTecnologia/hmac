import type { Scenario, SeqElement } from '../lib/scenarios'

const HEADER_Y = 14
const HEADER_H = 30
const TOP_GAP = 16
const MSG_H = 56
const SELF_H = 62
const NOTE_H = 42
const DIV_H = 38
const BOTTOM_PAD = 18
const SPACING = 360

type Positioned = SeqElement & { y: number; h: number }

function elementHeight(el: SeqElement): number {
  if (el.type === 'divider') return DIV_H
  if (el.type === 'note') return NOTE_H
  if (el.type === 'self') return SELF_H
  return MSG_H
}

/** Quebra labels longas em até 2 linhas (prefere ' · ', depois último espaço). */
function labelLines(label: string, maxChars = 44): string[] {
  if (label.length <= maxChars) return [label]
  const sep = ' · '
  if (label.includes(sep)) {
    const parts = label.split(sep)
    let splitAt = 0
    let acc = 0
    for (let i = 0; i < parts.length; i++) {
      acc += parts[i].length + (i > 0 ? sep.length : 0)
      if (acc <= maxChars) splitAt = i + 1
      else break
    }
    if (splitAt > 0 && splitAt < parts.length) {
      return [parts.slice(0, splitAt).join(sep), parts.slice(splitAt).join(sep)]
    }
  }
  let cut = label.lastIndexOf(' ', maxChars)
  if (cut < 12) cut = maxChars
  return [label.slice(0, cut), label.slice(cut + 1)]
}

/** Diagrama de sequência renderizado em SVG a partir dos dados do cenário. */
export function SequenceDiagram({ scenario }: { scenario: Scenario }) {
  const n = scenario.actors.length
  const actorW = scenario.actors.map((a) => Math.max(110, a.label.length * 7 + 18))
  const edgePad = Math.max(...actorW) / 2 + 16
  const width = Math.max(680, edgePad * 2 + SPACING * (n - 1))
  const xOf = (actorId: string) => {
    const i = scenario.actors.findIndex((a) => a.id === actorId)
    return edgePad + i * SPACING
  }

  const positioned: Positioned[] = []
  let y = HEADER_Y + HEADER_H + TOP_GAP
  for (const el of scenario.elements) {
    const h = elementHeight(el)
    positioned.push({ ...el, y, h })
    y += h
  }
  const height = y + BOTTOM_PAD
  const lifeTop = HEADER_Y + HEADER_H
  const lifeBottom = height - 6

  return (
    <div className="seq-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Diagrama de sequência: ${scenario.title}`}>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
          </marker>
          <marker id="arrRet" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
          </marker>
          <marker id="arrCrypto" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#fb923c" />
          </marker>
        </defs>

        {/* lifelines */}
        {scenario.actors.map((a) => (
          <line key={`life-${a.id}`} className="seq-life" x1={xOf(a.id)} y1={lifeTop} x2={xOf(a.id)} y2={lifeBottom} />
        ))}

        {/* elements */}
        {positioned.map((el, i) => {
          if (el.type === 'divider') {
            const cy = el.y + el.h / 2
            const chipW = el.label.length * 7.5 + 28
            return (
              <g key={i} className="seq-divider">
                <line x1={8} y1={cy} x2={width - 8} y2={cy} />
                <rect x={width / 2 - chipW / 2} y={cy - 10} width={chipW} height={20} rx={10} />
                <text x={width / 2} y={cy + 4} textAnchor="middle">{el.label}</text>
              </g>
            )
          }
          if (el.type === 'note') {
            const x = xOf(el.actor)
            const w = Math.max(200, Math.min(420, el.text.length * 6.2 + 24))
            const nx = Math.max(4, Math.min(x - w / 2, width - w - 4))
            return (
              <g key={i} className="seq-note">
                <rect x={nx} y={el.y + 4} width={w} height={el.h - 10} />
                <text x={nx + w / 2} y={el.y + el.h / 2 + 2} textAnchor="middle">{el.text}</text>
              </g>
            )
          }
          if (el.type === 'self') {
            const idx = scenario.actors.findIndex((a) => a.id === el.actor)
            const x = xOf(el.actor)
            const goLeft = idx === n - 1 && n > 1
            const dir = goLeft ? -1 : 1
            const y0 = el.y + el.h - 22
            const lines = labelLines(el.label, 42)
            return (
              <g key={i} className="seq-msg seq-self">
                <text x={x + 52 * dir} y={el.y + 12} textAnchor="middle">
                  {lines.map((l, li) => (
                    <tspan key={li} x={x + 52 * dir} dy={li === 0 ? 0 : 14}>{l}</tspan>
                  ))}
                </text>
                <path
                  className="arrow-line"
                  d={`M ${x} ${y0 - 16} H ${x + 46 * dir} V ${y0} H ${x}`}
                  fill="none"
                  markerEnd="url(#arrCrypto)"
                />
              </g>
            )
          }
          // msg
          const x1 = xOf(el.from)
          const x2 = xOf(el.to)
          const kind = el.kind ?? 'sync'
          const cls = kind === 'return' ? 'ret' : kind === 'crypto' ? 'crypto' : ''
          const marker = kind === 'return' ? 'url(#arrRet)' : kind === 'crypto' ? 'url(#arrCrypto)' : 'url(#arr)'
          const cy = el.y + el.h - 14
          const lines = labelLines(el.label)
          return (
            <g key={i} className={`seq-msg ${cls}`}>
              <text x={(x1 + x2) / 2} y={el.y + 12} textAnchor="middle">
                {lines.map((l, li) => (
                  <tspan key={li} x={(x1 + x2) / 2} dy={li === 0 ? 0 : 14}>{l}</tspan>
                ))}
              </text>
              <line x1={x1} y1={cy} x2={x2} y2={cy} markerEnd={marker} />
            </g>
          )
        })}

        {/* actor headers (por cima de tudo) */}
        {scenario.actors.map((a, i) => (
          <g key={`actor-${a.id}`} className="seq-actor">
            <rect x={xOf(a.id) - actorW[i] / 2} y={HEADER_Y} width={actorW[i]} height={HEADER_H} rx={6} />
            <text x={xOf(a.id)} y={HEADER_Y + HEADER_H / 2 + 4} textAnchor="middle">{a.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}
