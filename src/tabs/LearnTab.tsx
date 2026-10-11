import { Callout } from '../components/ui'
import { HASHES } from '../lib/hmac'

export function LearnTab() {
  return (
    <div className="learn" style={{ maxWidth: 980 }}>
      <div className="card">
        <h2>O que é HMAC?</h2>
        <p>
          <strong>HMAC</strong> (Hash-based Message Authentication Code, <a href="https://www.rfc-editor.org/rfc/rfc2104" target="_blank" rel="noreferrer">RFC 2104</a>)
          é uma construção que transforma qualquer função de hash criptográfica em um
          <em> código de autenticação de mensagem</em>: um pedaço de bytes que prova, ao mesmo tempo,
          <strong> autenticidade</strong> (a mensagem veio de quem conhece a chave secreta) e
          <strong> integridade</strong> (a mensagem não foi alterada em trânsito).
        </p>
        <div className="formula">
          <span className="h">HMAC</span>(<span className="k">K</span>, <span className="m">m</span>) = <span className="h">H</span>( (<span className="k">K₀</span> ⊕ <span className="op">opad</span>) ∥ <span className="h">H</span>( (<span className="k">K₀</span> ⊕ <span className="ip">ipad</span>) ∥ <span className="m">m</span> ) )
        </div>
        <ul>
          <li><code>K</code> — chave secreta compartilhada; <code>K₀</code> — a chave normalizada ao tamanho do bloco B.</li>
          <li><code>H</code> — função de hash (SHA-256, SHA-512…); <code>B</code> — tamanho do bloco interno dela (64B para SHA-1/256/MD5, 128B para SHA-384/512).</li>
          <li><code>ipad</code> = byte <code>0x36</code> repetido B vezes; <code>opad</code> = byte <code>0x5c</code> repetido B vezes.</li>
          <li><code>∥</code> concatenação, <code>⊕</code> XOR bit a bit.</li>
        </ul>
        <p>
          O segredo é misturado à mensagem <strong>duas vezes</strong>, em posições diferentes —
          é isso que separa o HMAC de um simples “hash com sal”. Veja cada etapa na aba
          <strong> Calcular HMAC</strong>.
        </p>
      </div>

      <div className="card">
        <h2>Por que não usar H(K ∥ m)?</h2>
        <p>
          A ideia ingênua de “prefixar o segredo e hashear” falha por causa do
          <strong> ataque de extensão de comprimento</strong>: funções de hash da família
          Merkle–Damgård (MD5, SHA-1, SHA-256) processam a entrada em blocos e o digest final
          é literalmente o estado interno da função. Quem conhece <code>H(K ∥ m)</code> pode
          continuar o hash a partir daquele estado e calcular <code>H(K ∥ m ∥ padding ∥ m′)</code>
          para um sufixo <code>m′</code> arbitrário — <em>sem conhecer K</em>.
        </p>
        <div className="flow">
          <span className="box">H(K ∥ m) conhecido</span><span className="arr">→</span>
          <span className="box">atacante estende com m′</span><span className="arr">→</span>
          <span className="box">H(K ∥ m ∥ pad ∥ m′) forjado</span>
        </div>
        <p>
          No HMAC, o atacante veria <code>H((K₀⊕opad) ∥ H(…))</code> — o estado interno da
          estrutura interna nunca é exposto, e o opad externo “reinicia” o hash com material
          da chave. Extensão de comprimento não se aplica.
        </p>
        <Callout kind="warn" title="Exemplo real">
          A vulnerabilidade do Flickr em 2009, explorada publicamente por Thai Duong e Juliano Rizzo,
          era exatamente um MAC do tipo <code>H(secret ∥ data)</code> — o ataque permitia forjar
          chamadas de API assinadas.
        </Callout>
      </div>

      <div className="card">
        <h2>As duas passadas, explicadas</h2>
        <div className="flow" style={{ alignItems: 'stretch' }}>
          <span className="box">K → K₀ (hash ou pad com zeros até B)</span><span className="arr">→</span>
          <span className="box">K₀ ⊕ ipad ∥ m → H → hash interno</span><span className="arr">→</span>
          <span className="box">K₀ ⊕ opad ∥ hash interno → H → MAC</span>
        </div>
        <ul>
          <li>
            <strong>Normalização da chave (K₀):</strong> se a chave é maior que B, ela é hasheada antes
            (chaves gigantes não dão segurança extra — viram um digest de L bytes). Se é menor, é
            completada com zeros até B. Por isso a recomendação é usar uma chave de ~L bytes.
          </li>
          <li>
            <strong>ipad vs opad:</strong> os pads <code>0x36</code> e <code>0x5c</code> diferem em
            muitos bits (diferença de Hamming alta), então as duas chaves derivadas ficam
            “distantes” uma da outra — as duas instâncias de hash se comportam como funções
            praticamente independentes.
          </li>
          <li>
            <strong>Por que funciona:</strong> a segurança se reduz a propriedades bem estudadas do
            hash (resistência a colisão do modo de compressão e pseudoaleatoriedade), mesmo para
            hashes com colisões conhecidas — HMAC-MD5 e HMAC-SHA-1 seguiram sem ataque prático de
            falsificação por muito tempo (ainda assim, prefira SHA-2).
          </li>
        </ul>
      </div>

      <div className="card">
        <h2>Algoritmos típicos</h2>
        <table className="algs">
          <thead>
            <tr><th>Algoritmo</th><th>Bloco B</th><th>Digest L</th><th>Status</th><th>Uso típico</th></tr>
          </thead>
          <tbody>
            {(Object.keys(HASHES) as (keyof typeof HASHES)[]).map((id) => {
              const h = HASHES[id]
              return (
                <tr key={id}>
                  <td>{h.label}</td>
                  <td>{h.blockSize}B</td>
                  <td>{h.outputSize}B</td>
                  <td>
                    <span className={`badge ${h.status === 'recomendado' ? 'ok' : h.status === 'inseguro' ? 'danger' : 'warn'}`} style={{ marginLeft: 0 }}>
                      {h.statusLabel}
                    </span>
                  </td>
                  <td className="muted">{h.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Callout kind="info" title="Regra prática">
          Use <strong>HMAC-SHA-256</strong> salvo motivo para outra coisa: é o equilíbrio padrão de
          segurança, desempenho e interoperabilidade. SHA-512 rende mais em CPUs de 64 bits e dá
          margem extra; SHA-1 e MD5 só aparecem por legado.
        </Callout>
      </div>

      <div className="card">
        <h2>Onde o HMAC aparece</h2>
        <ul>
          <li><strong>Assinatura de APIs</strong> — AWS Signature V4 (cadeia de HMACs derivados), APIs com api_key + api_secret, webhooks do GitHub (<code>X-Hub-Signature-256</code>), Stripe (<code>Stripe-Signature</code>), Shopify, Slack, Twilio.</li>
          <li><strong>JWT</strong> — os algoritmos HS256/384/512 do JWS são HMAC sobre <code>b64url(header).b64url(payload)</code>.</li>
          <li><strong>TOTP/HOTP</strong> — os códigos de autenticação de dois fatores são HMAC da chave + contador/janela de tempo, truncado.</li>
          <li><strong>TLS</strong> — os ciphersuites clássicos usavam HMAC no MAC do record layer; o TLS 1.3 usa HMAC dentro do HKDF para derivar chaves.</li>
          <li><strong>Derivação de chaves</strong> — HKDF, PBKDF2 e o mecanismo de “challenge-response” de vários protocolos são construídos sobre HMAC.</li>
        </ul>
      </div>

      <div className="card">
        <h2>Boas práticas</h2>
        <ul>
          <li><strong>Chave com entropia real:</strong> gere com um CSPRNG, idealmente ≥ L bytes (32B para SHA-256). Senha memorável não é chave.</li>
          <li><strong>Compare em tempo constante:</strong> nunca use <code>==</code>/loop com early-exit — o tempo de resposta vaza quantos bytes bateram (timing attack).</li>
          <li><strong>Canonize antes de assinar:</strong> defina exatamente quais bytes entram no HMAC (ordem de campos, espaços, encoding). JSON re-serializado pode mudar.</li>
          <li><strong>Freshness:</strong> inclua timestamp + nonce (ou contador) dentro do conteúdo assinado — o HMAC não protege contra replay.</li>
          <li><strong>O segredo nunca trafega:</strong> distribua por canal separado, identifique a chave por um id público (api_key) e preveja rotação com janela de coexistência.</li>
          <li><strong>Erro genérico:</strong> ao rejeitar, não revele se o erro foi chave inexistente, MAC inválido ou timestamp expirado.</li>
          <li><strong>Confidencialidade à parte:</strong> HMAC não cifra nada — a mensagem vai em claro. Combine com TLS para sigilo.</li>
        </ul>
      </div>

      <div className="card">
        <h2>Referências</h2>
        <ul className="small">
          <li><a href="https://www.rfc-editor.org/rfc/rfc2104" target="_blank" rel="noreferrer">RFC 2104</a> — HMAC: Keyed-Hashing for Message Authentication</li>
          <li><a href="https://www.rfc-editor.org/rfc/rfc2202" target="_blank" rel="noreferrer">RFC 2202</a> — vetores de teste HMAC-MD5 e HMAC-SHA-1</li>
          <li><a href="https://www.rfc-editor.org/rfc/rfc4231" target="_blank" rel="noreferrer">RFC 4231</a> — vetores de teste HMAC-SHA-2</li>
          <li><a href="https://www.rfc-editor.org/rfc/rfc4868" target="_blank" rel="noreferrer">RFC 4868</a> — HMAC-SHA-256/384/512 no IPsec</li>
          <li><a href="https://csrc.nist.gov/pubs/fips/198-1/final" target="_blank" rel="noreferrer">FIPS 198-1</a> — padronização NIST do HMAC</li>
        </ul>
      </div>
    </div>
  )
}
