const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export function bytesToBase64(bytes: Uint8Array): string {
  let b64 = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined
    b64 += b64chars[b0 >> 2]
    b64 += b64chars[((b0 & 3) << 4) | (b1 === undefined ? 0 : b1 >> 4)]
    b64 += b1 === undefined ? '=' : b64chars[((b1 & 15) << 2) | (b2 === undefined ? 0 : b2 >> 6)]
    b64 += b2 === undefined ? '=' : b64chars[b2 & 63]
  }
  return b64
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function base64ToBytes(input: string): Uint8Array {
  let b64 = input.trim().replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '')
  const pad = b64.length % 4
  if (pad === 1) throw new Error('Base64 inválido')
  if (pad) b64 += '='.repeat(4 - pad)
  const bytes = new Uint8Array(Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0))
  let p = 0
  for (let i = 0; i < b64.length; i += 4) {
    const c0 = b64chars.indexOf(b64[i])
    const c1 = b64chars.indexOf(b64[i + 1])
    const c2 = b64[i + 2] === '=' ? 64 : b64chars.indexOf(b64[i + 2])
    const c3 = b64[i + 3] === '=' ? 64 : b64chars.indexOf(b64[i + 3])
    if (c0 < 0 || c1 < 0 || (c2 < 0 && c2 !== 64) || (c3 < 0 && c3 !== 64)) throw new Error('Base64 inválido')
    const n = (c0 << 18) | (c1 << 12) | ((c2 === 64 ? 0 : c2) << 6) | (c3 === 64 ? 0 : c3)
    if (p < bytes.length) bytes[p++] = (n >> 16) & 0xff
    if (p < bytes.length) bytes[p++] = (n >> 8) & 0xff
    if (p < bytes.length) bytes[p++] = n & 0xff
  }
  return bytes
}

export function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '')
  if (clean.length % 2 !== 0) throw new Error('Hexadecimal inválido (número ímpar de dígitos)')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

export function utf8ToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

export type Encoding = 'utf8' | 'hex' | 'base64'

export function decodeByEncoding(text: string, encoding: Encoding): Uint8Array {
  if (encoding === 'utf8') return utf8ToBytes(text)
  if (encoding === 'base64') return base64ToBytes(text)
  return hexToBytes(text)
}

/** Adivinha o encoding mais provável de um MAC colado (hex, base64 ou base64url). */
export function guessMacEncoding(text: string, expectedLen: number): Encoding | null {
  const t = text.trim()
  if (/^[0-9a-fA-F]+$/.test(t) && t.length === expectedLen * 2) return 'hex'
  try {
    const b = base64ToBytes(t)
    if (b.length === expectedLen) return 'base64'
  } catch {
    /* não é base64 válido */
  }
  return null
}

export function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n)
  crypto.getRandomValues(b)
  return b
}
