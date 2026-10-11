/**
 * MD5 (RFC 1321) — implementação em TypeScript puro, usada apenas para fins
 * didáticos (o WebCrypto não oferece MD5). MD5 é considerado quebrado para
 * colisões; HMAC-MD5 ainda aparece em sistemas legados, mas não deve ser
 * usado em projetos novos.
 */

const S: number[] = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

// K[i] = floor(2^32 * abs(sin(i + 1))), i = 0..63
const K: number[] = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0)

// Ordem de leitura dos 16 words do bloco em cada rodada
const M: number[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  1, 6, 11, 0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12,
  5, 8, 11, 14, 1, 4, 7, 10, 13, 0, 3, 6, 9, 12, 15, 2,
  0, 7, 14, 5, 12, 3, 10, 1, 8, 15, 6, 13, 4, 11, 2, 9,
]

function rotl(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0
}

export function md5(input: Uint8Array): Uint8Array {
  // Padding: 0x80, zeros até 56 mod 64, depois o comprimento em bits (little-endian, 8 bytes)
  const bitLen = input.length * 8
  const padded = new Uint8Array(((input.length + 8) >> 6 << 6) + 64)
  padded.set(input)
  padded[input.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, bitLen >>> 0, true)
  view.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  const words = new Uint32Array(16)
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) words[i] = view.getUint32(off + i * 4, true)

    let A = a0
    let B = b0
    let C = c0
    let D = d0

    for (let i = 0; i < 64; i++) {
      const round = i >> 4
      let F: number
      if (round === 0) F = (B & C) | (~B & D)
      else if (round === 1) F = (D & B) | (~D & C)
      else if (round === 2) F = B ^ C ^ D
      else F = C ^ (B | ~D)
      const tmp = D
      D = C
      C = B
      B = (B + rotl((A + F + K[i] + words[M[i]]) >>> 0, S[i])) >>> 0
      A = tmp
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  const out = new Uint8Array(16)
  const outView = new DataView(out.buffer)
  outView.setUint32(0, a0, true)
  outView.setUint32(4, b0, true)
  outView.setUint32(8, c0, true)
  outView.setUint32(12, d0, true)
  return out
}
