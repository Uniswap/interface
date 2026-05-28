import { describe, expect, test, vi } from 'vitest'
import { withTimeout } from './withTimeout'

describe('withTimeout', () => {
  test('resolves when promise settles before timeout', async () => {
    const result = await withTimeout(Promise.resolve('ok'), { timeoutMs: 100, label: 'test' })
    expect(result).toBe('ok')
  })

  test('rejects with labelled error when promise hangs past timeout', async () => {
    const hung = new Promise(() => {
      // intentionally never resolves
    })
    await expect(withTimeout(hung, { timeoutMs: 10, label: 'sessionHeaders' })).rejects.toThrow(
      'sessionHeaders timed out after 10ms',
    )
  })

  test('clears timer when promise resolves first to avoid leaked handles', async () => {
    const clearSpy = vi.spyOn(global, 'clearTimeout')

    await withTimeout(Promise.resolve(42), { timeoutMs: 100, label: 'test' })

    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

  test('propagates underlying rejection without timeout interference', async () => {
    const rejected = Promise.reject(new Error('underlying failure'))
    await expect(withTimeout(rejected, { timeoutMs: 1000, label: 'test' })).rejects.toThrow('underlying failure')
  })
})
