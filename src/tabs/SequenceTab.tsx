import { useState } from 'react'
import { Inline } from '../components/Markdown'
import { SequenceDiagram } from '../components/SequenceDiagram'
import { Callout } from '../components/ui'
import { SCENARIOS } from '../lib/scenarios'

export function SequenceTab() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]

  const select = (id: string) => {
    setScenarioId(id)
    const s = SCENARIOS.find((x) => x.id === id)
    window.gtag?.('event', 'select_content', {
      content_type: 'sequence_scenario',
      item_id: id,
      item_name: s?.label,
    })
  }

  return (
    <div>
      <div className="card">
        <h2>Comunicação com HMAC — diagramas de sequência</h2>
        <p className="muted" style={{ marginTop: -4 }}>
          O HMAC em si é um cálculo local; o que o torna útil é o <strong>protocolo em volta</strong>:
          como o segredo é distribuído, o que é assinado, como o MAC trafega e o que o verificador
          faz com ele. Escolha um cenário:
        </p>
        <div className="seg-ctrl" role="tablist" aria-label="Cenários">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === scenarioId}
              className={s.id === scenarioId ? 'on' : ''}
              onClick={() => select(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <h3 style={{ marginTop: 18 }}>{scenario.title}</h3>
        <p className="muted">{scenario.intro}</p>
      </div>

      <div className="card">
        <SequenceDiagram scenario={scenario} />
        <p className="small muted" style={{ marginBottom: 0 }}>
          <span style={{ color: 'var(--accent)' }}>— seta laranja:</span> canal seguro / passo criptográfico ·{' '}
          <span className="muted">- - seta tracejada:</span> resposta · laço próprio: cálculo local
        </p>
      </div>

      <div className="card">
        <h2>Passo a passo</h2>
        <ol className="seq-steps">
          {scenario.steps.map((s, i) => (
            <li key={i}>
              <Inline text={s} />
            </li>
          ))}
        </ol>
        <Callout kind="info" title="Ideia central">
          <Inline text={scenario.takeaway} />
        </Callout>
      </div>
    </div>
  )
}
