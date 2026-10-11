import { useMemo, useState } from 'react'
import { Callout, Segmented } from '../components/ui'
import { base64ToBytes, decodeByEncoding, guessMacEncoding, hexToBytes, type Encoding } from '../lib/encoding'
import { HASHES, firstDiffIndex, hmacCompute, timingSafeEqual, type HashId } from '../lib/hmac'

const HASH_OPTIONS = (Object.keys(HASHES) as HashId[]).map((id) => ({ value: id, label: HASHES[id].label }))

interface VerifyState {
  expected: Uint8Array
  received: Uint8Array
  match: boolean
  diffAt: number
  detectedEnc: Encoding | null
}

export function VerifyTab() {
  const [hashId, setHashId] = useState<HashId>('SHA-256')
  const [keyEnc, setKeyEnc] = useState<Encoding>('utf8')
  const [keyText, setKeyText] = useState('segredo-super-secreto')
  const [msgEnc, setMsgEnc] = useState<Encoding>('utf8')
  const [msgText, setMsgText] = useState('mensagem a autenticar')
  const [macText, setMacText] = useState('')
  const [state, setState] = useState<VerifyState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const info = HASHES[hashId]

  const detectedEnc = useMemo(() => guessMacEncoding(macText, info.outputSize), [macText, info.outputSize])

  const verify = async () => {
    setError(null)
    setState(null)
    let key: Uint8Array
    let msg: Uint8Array
    let received: Uint8Array
    try {
      key = decodeByEncoding(keyText, keyEnc)
    } catch (e) {
      setError(`Chave: ${(e as Error).message}`)
      return
    }
    try {
      msg = decodeByEncoding(msgText, msgEnc)
    } catch (e) {
      setError(`Mensagem: ${(e as Error).message}`)
      return
    }
    try {
      received = detectedEnc === 'hex' || detectedEnc === null ? hexToBytes(macText) : base64ToBytes(macText)
    } catch (e) {
      setError(`MAC recebido: ${(e as Error).message}`)
      return
    }
    const r = await hmacCompute(info, key, msg)
    const match = timingSafeEqual(r.mac, received)
    setState({ expected: r.mac, received, match, diffAt: firstDiffIndex(r.mac, received), detectedEnc })
    window.gtag?.('event', 'hmac_verify', { event_category: 'hmac', algorithm: hashId, match })
  }

  const macLenOk = state ? state.received.length === info.outputSize : null

  return (
    <div className="cols">
      <section>
        <div className="card">
          <h2>Verificar um MAC recebido</h2>

          <label className="field">
            <span>Algoritmo</span>
            <select value={hashId} onChange={(e) => setHashId(e.target.value as HashId)}>
              {HASH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label} ({o.label === 'HMAC-MD5' ? '16B' : HASHES[o.value].outputSize + 'B'})</option>
              ))}
            </select>
          </label>

          <div className="row">
            <label className="field" style={{ flex: 2 }}>
              <span>Chave secreta</span>
              <textarea className="mono" rows={2} value={keyText} onChange={(e) => setKeyText(e.target.value)} spellCheck={false} />
            </label>
            <div className="shrink">
              <span className="small muted" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Encoding</span>
              <Segmented<Encoding>
                options={[{ value: 'utf8', label: 'Texto' }, { value: 'hex', label: 'Hex' }, { value: 'base64', label: 'Base64' }]}
                value={keyEnc}
                onChange={setKeyEnc}
              />
            </div>
          </div>

          <div className="row">
            <label className="field" style={{ flex: 2 }}>
              <span>Mensagem (exatamente como foi assinada)</span>
              <textarea className="mono" rows={4} value={msgText} onChange={(e) => setMsgText(e.target.value)} spellCheck={false} />
            </label>
            <div className="shrink">
              <span className="small muted" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Encoding</span>
              <Segmented<Encoding>
                options={[{ value: 'utf8', label: 'Texto' }, { value: 'hex', label: 'Hex' }, { value: 'base64', label: 'Base64' }]}
                value={msgEnc}
                onChange={setMsgEnc}
              />
            </div>
          </div>

          <label className="field">
            <span>
              MAC recebido (hex ou base64)
              {detectedEnc && <span className="badge info">detectado: {detectedEnc}</span>}
            </span>
            <textarea
              className="mono"
              rows={3}
              value={macText}
              onChange={(e) => { setMacText(e.target.value); setState(null) }}
              placeholder={`ex.: ${info.outputSize * 2} dígitos hex ou ${Math.ceil(info.outputSize / 3) * 4} chars base64`}
              spellCheck={false}
            />
          </label>

          <button className="btn primary" onClick={verify} disabled={!macText.trim()}>
            Recalcular e comparar
          </button>
          {error && <div className="err-text">{error}</div>}
        </div>

        <Callout kind="info" title="Como um verificador real trabalha">
          <ol className="small" style={{ margin: '4px 0', paddingLeft: 18 }}>
            <li>Obtém o segredo associado à identidade do remetente (api_key, webhook secret…).</li>
            <li>Pega a mensagem <strong>exatamente como chegou</strong> (bytes crus — sem re-serializar JSON).</li>
            <li>Recalcula o HMAC com o algoritmo anunciado pelo protocolo (não pelo cliente!).</li>
            <li>Compara os bytes em <strong>tempo constante</strong> e decide aceitar ou rejeitar.</li>
          </ol>
        </Callout>
      </section>

      <section>
        <div className="card">
          <h2>Resultado da verificação</h2>
          {!state && <p className="muted small">Cole o MAC recebido e clique em “Recalcular e comparar”.</p>}
          {state && (
            <>
              {state.match ? (
                <Callout kind="ok" title="MAC válido — a mensagem é autêntica e íntegra">
                  O HMAC recalculado é idêntico ao recebido: a mensagem veio de quem conhece o segredo e não foi alterada.
                </Callout>
              ) : (
                <Callout kind="danger" title="MAC inválido — rejeite a mensagem">
                  O HMAC recalculado difere do recebido. Ou a mensagem foi alterada, ou a chave/algoritmo/encoding estão errados, ou o remetente não conhece o segredo.
                </Callout>
              )}

              <h4>Esperado (recalculado)</h4>
              <div className="mac-compare">
                {[...state.expected].map((b, i) => (
                  <span key={i} className={state.diffAt >= 0 && i >= state.diffAt ? 'diff' : 'same'}>
                    {b.toString(16).padStart(2, '0')}
                  </span>
                ))}
              </div>
              <h4>Recebido</h4>
              <div className="mac-compare">
                {[...state.received].map((b, i) => (
                  <span key={i} className={state.diffAt >= 0 && i >= state.diffAt ? 'diff' : 'same'}>
                    {b.toString(16).padStart(2, '0')}
                  </span>
                ))}
              </div>
              {state.diffAt >= 0 && (
                <p className="small muted">
                  Primeira divergência no byte #{state.diffAt}. Tamanho esperado: {info.outputSize}B; recebido: {state.received.length}B.
                </p>
              )}

              <h4>Checklist didático</h4>
              <ul className="checks">
                <li className={macLenOk ? 'pass' : 'fail'}>
                  <span className="lab">{macLenOk ? 'OK' : 'FALHOU'}</span>
                  Tamanho do MAC
                  <span className="det">
                    HMAC-{hashId} produz {info.outputSize} bytes; recebido tem {state.received.length} bytes.
                    {!macLenOk && ' Tamanho errado quase sempre indica algoritmo ou encoding errado.'}
                  </span>
                </li>
                <li className={state.detectedEnc ? 'pass' : 'info'}>
                  <span className="lab">{state.detectedEnc ? 'OK' : 'INFO'}</span>
                  Encoding do MAC
                  <span className="det">
                    {state.detectedEnc
                      ? `Detectado como ${state.detectedEnc}. Se o emissor usou outro encoding, converta antes de comparar bytes.`
                      : 'Não foi possível detectar; tentei hex e base64. Verifique o formato esperado pelo protocolo.'}
                  </span>
                </li>
                <li className={state.match ? 'pass' : 'fail'}>
                  <span className="lab">{state.match ? 'OK' : 'FALHOU'}</span>
                  Comparação em tempo constante
                  <span className="det">
                    {state.match
                      ? 'Bytes idênticos — comparação percorreu todo o buffer sem early-exit.'
                      : 'Bytes divergentes — a comparação em tempo constante ainda percorre tudo, sem revelar onde divergiu.'}
                  </span>
                </li>
                <li className="info">
                  <span className="lab">LEMBRE</span>
                  Mensagem canonizada
                  <span className="det">
                    O MAC só bate se os bytes assinados forem idênticos: mesmo JSON re-ordenado, espaço extra, quebra de linha ou normalização Unicode já muda o resultado.
                  </span>
                </li>
                <li className="info">
                  <span className="lab">LEMBRE</span>
                  Freshness não é do HMAC
                  <span className="det">
                    Um MAC válido pode ser um replay. Verifique timestamp/nonce embutidos na mensagem assinada — veja a aba “Diagrama de sequência”.
                  </span>
                </li>
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
