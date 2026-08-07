import { describe, expect, it } from 'vitest'
import { zeroBuffers } from './zeroize'

describe('zeroBuffers', () => {
  it('overwrites a single buffer with zeros in place', () => {
    const buf = new Uint8Array([1, 2, 3, 4])
    zeroBuffers(buf)
    expect(buf).toEqual(new Uint8Array([0, 0, 0, 0]))
  })

  it('zeros every buffer passed to it', () => {
    const a = new Uint8Array([1, 2, 3])
    const b = new Uint8Array([9, 8])
    zeroBuffers(a, b)
    expect(a).toEqual(new Uint8Array([0, 0, 0]))
    expect(b).toEqual(new Uint8Array([0, 0]))
  })

  it('skips undefined entries without throwing', () => {
    const buf = new Uint8Array([7, 7])
    expect(() => zeroBuffers(undefined, buf, undefined)).not.toThrow()
    expect(buf).toEqual(new Uint8Array([0, 0]))
  })

  it('is a no-op when called with no buffers', () => {
    expect(() => zeroBuffers()).not.toThrow()
  })

  it('leaves length unchanged', () => {
    const buf = new Uint8Array(32).fill(1)
    zeroBuffers(buf)
    expect(buf.length).toBe(32)
    expect(buf.every((byte) => byte === 0)).toBe(true)
  })
})
