import { singleflight } from '@universe/sessions/src/session-gate/singleflight'
import { describe, expect, it, vi } from 'vitest'

describe('singleflight', () => {
  it('returns the same promise for concurrent calls', async () => {
    let resolve!: () => void
    const inner = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    const wrapped = singleflight(inner)
    const a = wrapped()
    const b = wrapped()
    expect(inner).toHaveBeenCalledOnce()
    expect(a).toBe(b)
    resolve()
    await Promise.all([a, b])
  })

  it('clears the slot after settlement so subsequent calls trigger a new invocation', async () => {
    let resolve!: () => void
    const inner = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    const wrapped = singleflight(inner)
    const first = wrapped()
    resolve()
    await first
    const second = wrapped()
    expect(inner).toHaveBeenCalledTimes(2)
    expect(second).not.toBe(first)
  })

  it('clears the slot after rejection', async () => {
    let calls = 0
    const inner = vi.fn(() => {
      calls++
      return calls === 1 ? Promise.reject(new Error('first')) : Promise.resolve()
    })
    const wrapped = singleflight(inner)
    await expect(wrapped()).rejects.toThrow('first')
    await expect(wrapped()).resolves.toBeUndefined()
    expect(inner).toHaveBeenCalledTimes(2)
  })

  it('does not coalesce calls placed after settlement', async () => {
    let resolve!: () => void
    const inner = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    const wrapped = singleflight(inner)
    const first = wrapped()
    resolve()
    await first
    const second = wrapped()
    expect(second).not.toBe(first)
  })
})
