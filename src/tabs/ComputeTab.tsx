import { useEffect, useMemo, useState } from 'react'
import { Callout, CopyButton, HexView, Segmented } from '../components/ui'
import { decodeByEncoding, bytesToHex, bytesToBase64, bytesToBase64Url, randomBytes, utf8ToBytes, type Encoding } from '../lib/encoding'
import { HASHES, hmacCompute, keyStrength, type HashId, type HmacComputation } from '../lib/hmac'

const HASH_OPTIONS = (Object.keys(HASHES) as HashId[]).map((id) => ({ value: id, label: HASHES[id].label }))

/** Vetores de teste clássicos (RFC 2202 para MD5/SHA-1, RFC 4231 para SHA-2). */
const PRESETS: { label: string; hash: HashId; keyHex: string; message: string; msgEnc: Encoding }[] = [
  { label: 'RFC 4231 TC1 — chave 0x0b×20, msg "Hi There"', hash: 'SHA-256', keyHex: '0b'.repeat(20), message: 'Hi There', msgEnc: 'utf8' },
  { label: 'RFC 4231 TC2 — chave "Jefe", msg "what do ya want for nothing?"', hash: 'SHA-256', keyHex: bytesToHex(utf8ToBytes('Jefe')), message: 'what do ya want for nothing?', msgEnc: 'utf8' },
  { label: 'RFC 4231 TC3 — chave 0xaa×20, msg 0xdd×50', hash: 'SHA-256', keyHex: 'aa'.repeat(20), message: 'dd'.repeat(50), msgEnc: 'hex' },
]

export function ComputeTab() {
  const [hashId, setHashId] = useState<HashId>('SHA-256')
  const [keyEnc, setKeyEnc] = useState<Encoding>('utf8')
  const [keyText, setKeyText] = useState('segredo-super-secreto')
  const [msgEnc, setMsgEnc] = useState<Encoding>('utf8')
  const [msgText, setMsgText] = useState('mensagem a autenticar')
  const [result, setResult] = useState<HmacComputation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const info = HASHES[hashId]

  const keyBytes = useMemo(() => {
    try {
      return decodeByEncoding(keyText, keyEnc)
    } catch {
      return null
    }
  }, [keyText, keyEnc])

  const msgBytes = useMemo(() => {
    try {
      return decodeByEncoding(msgText, msgEnc)
    } catch {
      return null
    }
  }, [msgText, msgEnc])

  useEffect(() => {
    let cancelled = false
    if (!keyBytes || !msgBytes) {
      setResult(null)
      setError(
        !keyBytes && keyText.length > 0 ? `Chave: encoding ${keyEnc} inválido` :
        !msgBytes && msgText.length > 0 ? `Mensagem: encoding ${msgEnc} inválido` : null,
      )
      return
    }
    setError(null)
    hmacCompute(info, keyBytes, msgBytes)
      .then((r) => { if (!cancelled) setResult(r) })
      .catch((e) => { if (!cancelled) setError(String(e)) })
    return () => { cancelled = true }
  }, [info, keyBytes, msgBytes, keyText, keyEnc, msgText, msgEnc])

  const strength = useMemo(() => (keyBytes ? keyStrength(keyBytes, info.outputSize) : null), [keyBytes, info.outputSize])

  const macHex = result ? bytesToHex(result.mac) : ''
  const macB64 = result ? bytesToBase64(result.mac) : ''
  const macB64url = result ? bytesToBase64Url(result.mac) : ''

  const applyPreset = (i: number) => {
    const p = PRESETS[i]
    setHashId(p.hash)
    setKeyEnc('hex')
    setKeyText(p.keyHex)
    setMsgEnc(p.msgEnc)
    setMsgText(p.message)
  }

  return (
    <div className="cols">
      <section>
        <div className="card">
          <h2>Entradas</h2>

          <label className="field">
            <span>Algoritmo</span>
            <select value={hashId} onChange={(e) => setHashId(e.target.value as HashId)}>
              {HASH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <p className="small muted" style={{ marginTop: -6 }}>
            <span className={`badge ${info.status === 'recomendado' ? 'ok' : info.status === 'inseguro' ? 'danger' : 'warn'}`} style={{ marginLeft: 0 }}>
              {info.statusLabel}
            </span>{' '}
            bloco {info.blockSize}B · digest {info.outputSize}B — {info.note}
          </p>

          <div className="row">
            <label className="field" style={{ flex: 2 }}>
              <span>Chave secreta (K)</span>
              <textarea className="mono" rows={3} value={keyText} onChange={(e) => setKeyText(e.target.value)} spellCheck={false} />
            </label>
            <div className="shrink">
              <span className="small muted" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Encoding</span>
              <Segmented<Encoding>
                options={[{ value: 'utf8', label: 'Texto' }, { value: 'hex', label: 'Hex' }, { value: 'base64', label: 'Base64' }]}
                value={keyEnc}
                onChange={setKeyEnc}
              />
              <button
                className="btn small"
                style={{ marginTop: 6 }}
                onClick={() => {
                  const b = randomBytes(info.outputSize)
                  if (keyEnc === 'utf8') { setKeyEnc('hex'); setKeyText(bytesToHex(b)) }
                  else if (keyEnc === 'hex') setKeyText(bytesToHex(b))
                  else setKeyText(bytesToBase64(b))
                }}
              >
                Gerar {info.outputSize * 8} bits
              </button>
            </div>
          </div>
          {strength && (
            <>
              <div className="meter">
                <div
                  style={{
                    width: `${Math.min(100, (strength.bits / (info.outputSize * 8)) * 100)}%`,
                    background: strength.level === 'fraca' ? 'var(--err)' : strength.level === 'ok' ? 'var(--warn)' : 'var(--ok)',
                  }}
                />
              </div>
              <div className="meter-label">{strength.label}{keyBytes && keyBytes.length > info.blockSize ? ` · > bloco (${info.blockSize}B): será hasheada antes do uso` : ''}</div>
            </>
          )}

          <div className="row" style={{ marginTop: 12 }}>
            <label className="field" style={{ flex: 2 }}>
              <span>Mensagem (m)</span>
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
            <span>Vetor de teste (confere com as RFCs)</span>
            <select defaultValue="" onChange={(e) => { if (e.target.value !== '') applyPreset(Number(e.target.value)); e.target.value = '' }}>
              <option value="" disabled>Carregar exemplo…</option>
              {PRESETS.map((p, i) => (
                <option key={i} value={i}>{p.label}</option>
              ))}
            </select>
          </label>

          {error && <div className="err-text">{error}</div>}
        </div>

        <Callout kind="info" title="O que está sendo calculado">
          <div className="formula">
            <span className="h">HMAC</span>(<span className="k">K</span>, <span className="m">m</span>) = <span className="h">H</span>( (<span className="k">K₀</span> ⊕ <span className="op">opad</span>) ∥ <span className="h">H</span>( (<span className="k">K₀</span> ⊕ <span className="ip">ipad</span>) ∥ <span className="m">m</span> ) )
          </div>
          <span className="small muted">
            ipad = 0x36 repetido · opad = 0x5c repetido · B = {info.blockSize} bytes (bloco da função de hash) · ∥ = concatenação
          </span>
        </Callout>
      </section>

      <section>
        <div className="card">
          <h2>Pipeline interno — passo a passo</h2>
          {!result && <p className="muted small">Informe chave e mensagem válidas para ver o cálculo.</p>}
          {result && (
            <div className="pipeline">
              <div className="pipe-node k-key">
                <span className="cap">1 · Chave K ({result.key.length} bytes)</span>
                <span className="desc">{result.keyWasHashed ? 'K é maior que o bloco B → primeiro calcula-se K₀ = H(K)' : 'K ≤ B → completada com bytes 0x00 até B bytes'}</span>
                <HexView bytes={result.key} color="var(--c-key)" maxLen={48} />
              </div>
              <div className="pipe-arrow">↓<span className="op">{result.keyWasHashed ? 'K₀ = H(K) ∥ 0x00…' : 'K₀ = K ∥ 0x00…'} ({info.blockSize}B)</span></div>
              <div className="pipe-node k-key">
                <span className="cap">2 · Chave normalizada K₀ ({info.blockSize}B)</span>
                <HexView bytes={result.k0} color="var(--c-key)" maxLen={48} />
              </div>
              <div className="pipe-branch" style={{ marginTop: 8 }}>
                <div>
                  <div className="pipe-arrow" style={{ textAlign: 'left' }}>⊕ ipad (0x36 ×{info.blockSize})</div>
                  <div className="pipe-node k-inner">
                    <span className="cap">3a · K₀ ⊕ ipad</span>
                    <HexView bytes={result.ipadXor} color="var(--c-inner)" maxLen={40} />
                  </div>
                  <div className="pipe-arrow">↓<span className="op">∥ mensagem ({result.key.length >= 0 ? result.innerInput.length - result.ipadXor.length : 0}B)</span></div>
                  <div className="pipe-node k-msg">
                    <span className="cap">3b · buffer interno: (K₀⊕ipad) ∥ m — {result.innerInput.length}B</span>
                    <HexView bytes={result.innerInput} maxLen={48} />
                  </div>
                  <div className="pipe-arrow">↓<span className="op">H(·)</span></div>
                  <div className="pipe-node k-inner">
                    <span className="cap">3c · hash interno ({info.outputSize}B)</span>
                    <HexView bytes={result.innerHash} color="var(--c-inner)" />
                  </div>
                </div>
                <div>
                  <div className="pipe-arrow" style={{ textAlign: 'left' }}>⊕ opad (0x5c ×{info.blockSize})</div>
                  <div className="pipe-node k-pad">
                    <span className="cap">4a · K₀ ⊕ opad</span>
                    <HexView bytes={result.opadXor} color="var(--c-pad)" maxLen={40} />
                  </div>
                  <div className="pipe-arrow">↓<span className="op">∥ hash interno</span></div>
                  <div className="pipe-node k-pad">
                    <span className="cap">4b · buffer externo: (K₀⊕opad) ∥ H_interno — {result.outerInput.length}B</span>
                    <HexView bytes={result.outerInput} maxLen={48} />
                  </div>
                  <div className="pipe-arrow">↓<span className="op">H(·)</span></div>
                  <div className="pipe-node k-mac">
                    <span className="cap">4c · MAC = HMAC-{hashId}(K, m)</span>
                    <HexView bytes={result.mac} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className="card">
            <h2>Resultado</h2>
            <h4>Hexadecimal</h4>
            <pre className="dump" style={{ color: 'var(--c-mac)' }}>{macHex}</pre>
            <div className="row" style={{ alignItems: 'center' }}>
              <CopyButton text={macHex} label="Copiar hex" />
              <span className="shrink muted small">usado por GitHub (X-Hub-Signature-256), AWS SigV4</span>
            </div>
            <h4>Base64</h4>
            <pre className="dump" style={{ color: 'var(--c-mac)' }}>{macB64}</pre>
            <div className="row" style={{ alignItems: 'center' }}>
              <CopyButton text={macB64} label="Copiar base64" />
              <span className="shrink muted small">usado por Stripe, Shopify, muitos webhooks</span>
            </div>
            <h4>Base64URL</h4>
            <pre className="dump" style={{ color: 'var(--c-mac)' }}>{macB64url}</pre>
            <div className="row" style={{ alignItems: 'center' }}>
              <CopyButton text={macB64url} label="Copiar base64url" />
              <span className="shrink muted small">usado em JWT HS{info.outputSize * 8}</span>
            </div>
            <Callout kind="warn" title="Mesmo HMAC, encodings diferentes">
              Os três valores acima são o <strong>mesmo</strong> MAC — só muda a representação. Ao verificar uma assinatura, confirme o encoding esperado pelo protocolo (hex vs base64), senão a comparação falha mesmo com o MAC correto.
            </Callout>
          </div>
        )}
      </section>
    </div>
  )
}
