import { md5 } from './md5'

export type HashId = 'SHA-256' | 'SHA-384' | 'SHA-512' | 'SHA-1' | 'MD5'

export interface HashInfo {
  id: HashId
  /** Nome exibido (HMAC-<id>) */
  label: string
  /** Tamanho do bloco interno da função de hash (B), em bytes */
  blockSize: number
  /** Tamanho do digest (L), em bytes */
  outputSize: number
  /** WebCrypto ou implementação local */
  engine: 'webcrypto' | 'local'
  status: 'recomendado' | 'aceitavel' | 'legado' | 'inseguro'
  statusLabel: string
  note: string
}

export const HASHES: Record<HashId, HashInfo> = {
  'SHA-256': {
    id: 'SHA-256', label: 'HMAC-SHA-256', blockSize: 64, outputSize: 32, engine: 'webcrypto',
    status: 'recomendado', statusLabel: 'Recomendado',
    note: 'Escolha padrão da indústria: JWT HS256, webhooks (GitHub, Stripe), AWS SigV4.',
  },
  'SHA-384': {
    id: 'SHA-384', label: 'HMAC-SHA-384', blockSize: 128, outputSize: 48, engine: 'webcrypto',
    status: 'recomendado', statusLabel: 'Recomendado',
    note: 'Família SHA-2 com bloco de 1024 bits; usado no JWT HS384 e em perfis de maior margem.',
  },
  'SHA-512': {
    id: 'SHA-512', label: 'HMAC-SHA-512', blockSize: 128, outputSize: 64, engine: 'webcrypto',
    status: 'recomendado', statusLabel: 'Recomendado',
    note: 'Maior digest da família SHA-2; usado no JWT HS512 e em APIs que preferem margem extra.',
  },
  'SHA-1': {
    id: 'SHA-1', label: 'HMAC-SHA-1', blockSize: 64, outputSize: 20, engine: 'webcrypto',
    status: 'legado', statusLabel: 'Legado',
    note: 'SHA-1 está quebrado para colisões, mas o HMAC-SHA-1 ainda aparece em sistemas antigos (ex.: header legado X-Hub-Signature do GitHub). Evite em projetos novos.',
  },
  MD5: {
    id: 'MD5', label: 'HMAC-MD5', blockSize: 64, outputSize: 16, engine: 'local',
    status: 'inseguro', statusLabel: 'Inseguro / didático',
    note: 'MD5 é considerado quebrado. Incluído apenas para fins didáticos e de interoperabilidade com legado; calculado por implementação local (o WebCrypto não oferece MD5).',
  },
}

async function hashDigest(info: HashInfo, data: Uint8Array): Promise<Uint8Array> {
  if (info.engine === 'local') return md5(data)
  const buf = await crypto.subtle.digest(info.id, data as BufferSource)
  return new Uint8Array(buf)
}

export function xorPad(k0: Uint8Array, padByte: number): Uint8Array {
  const out = new Uint8Array(k0.length)
  for (let i = 0; i < k0.length; i++) out[i] = k0[i] ^ padByte
  return out
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) { out.set(p, off); off += p.length }
  return out
}

export interface HmacComputation {
  /** Bytes da chave, como informados */
  key: Uint8Array
  /** Chave normalizada para o tamanho de bloco B (hasheada se > B, ou completada com zeros) */
  k0: Uint8Array
  /** Se a chave original era maior que B */
  keyWasHashed: boolean
  /** k0 XOR ipad (0x36) */
  ipadXor: Uint8Array
  /** Buffer interno: ipadXor || message */
  innerInput: Uint8Array
  /** H(ipadXor || message) */
  innerHash: Uint8Array
  /** k0 XOR opad (0x5c) */
  opadXor: Uint8Array
  /** Buffer externo: opadXor || innerHash */
  outerInput: Uint8Array
  /** MAC final */
  mac: Uint8Array
}

/**
 * Calcula o HMAC exposto passo a passo (RFC 2104):
 *   HMAC(K, m) = H( (K0 ⊕ opad) ∥ H( (K0 ⊕ ipad) ∥ m ) )
 * onde K0 = H(K) se len(K) > B, senão K completado com zeros até B bytes.
 */
export async function hmacCompute(info: HashInfo, key: Uint8Array, message: Uint8Array): Promise<HmacComputation> {
  const B = info.blockSize
  let k0: Uint8Array
  const keyWasHashed = key.length > B
  if (keyWasHashed) {
    const hashed = await hashDigest(info, key)
    k0 = new Uint8Array(B)
    k0.set(hashed)
  } else {
    k0 = new Uint8Array(B)
    k0.set(key)
  }

  const ipadXor = xorPad(k0, 0x36)
  const innerInput = concat(ipadXor, message)
  const innerHash = await hashDigest(info, innerInput)
  const opadXor = xorPad(k0, 0x5c)
  const outerInput = concat(opadXor, innerHash)
  const mac = await hashDigest(info, outerInput)

  return { key, k0, keyWasHashed, ipadXor, innerInput, innerHash, opadXor, outerInput, mac }
}

/** Comparação em tempo constante (não para no primeiro byte divergente). */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const max = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < max; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return diff === 0
}

/** Índice do primeiro byte divergente, ou -1 se iguais. */
export function firstDiffIndex(a: Uint8Array, b: Uint8Array): number {
  const max = Math.max(a.length, b.length)
  for (let i = 0; i < max; i++) {
    if ((a[i] ?? -1) !== (b[i] ?? -1)) return i
  }
  return -1
}

/** Estimativa grosseira de força da chave (entropia assumida pelo formato). */
export function keyStrength(keyBytes: Uint8Array, outputSize: number): { bits: number; label: string; level: 'fraca' | 'ok' | 'forte' } {
  const bits = keyBytes.length * 8
  if (bits < 64) return { bits, label: `${bits} bits — fraca demais (mínimo recomendado: ${outputSize * 8} bits)`, level: 'fraca' }
  if (bits < outputSize * 8) return { bits, label: `${bits} bits — aceitável, mas abaixo do tamanho do digest (${outputSize * 8} bits)`, level: 'ok' }
  return { bits, label: `${bits} bits — boa (≥ tamanho do digest)`, level: 'forte' }
}
