import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createExperimentsClient } from './client'
import { EXPERIMENTS_HEADER_NAME } from './codec'

vi.mock('utilities/src/logger/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

function responseWith(headers: Record<string, string>): Pick<Response, 'headers'> {
  return { headers: new Headers(headers) }
}

describe('createExperimentsClient', () => {
  describe('toHeaders', () => {
    it('returns no header when the set is empty', () => {
      expect(createExperimentsClient().toHeaders()).toEqual({})
    })

    it('serializes the active set under the shared header name', () => {
      const client = createExperimentsClient()
      client.set('checkout_flow_v2', { groupName: 'treatment', value: { buttonColor: 'green' } })

      expect(client.toHeaders()).toEqual({
        [EXPERIMENTS_HEADER_NAME]: '{"checkout_flow_v2":{"groupName":"treatment","value":{"buttonColor":"green"}}}',
      })
    })
  })

  describe('absorb', () => {
    it('merges experiments from a response header', () => {
      const client = createExperimentsClient()
      client.absorb(responseWith({ [EXPERIMENTS_HEADER_NAME]: '{"exp":{"groupName":"control","value":{"a":1}}}' }))

      expect(client.get('exp')).toEqual({ groupName: 'control', value: { a: 1 } })
    })

    it('is a no-op when the response has no experiments header', () => {
      const client = createExperimentsClient()
      client.absorb(responseWith({}))

      expect(client.snapshot()).toEqual({})
    })

    it('ignores a malformed header without throwing', () => {
      const client = createExperimentsClient()
      expect(() => client.absorb(responseWith({ [EXPERIMENTS_HEADER_NAME]: '{bad json' }))).not.toThrow()
      expect(client.snapshot()).toEqual({})
    })
  })

  it('round-trips set → toHeaders → absorb into another client', () => {
    const a = createExperimentsClient()
    a.set('exp', { groupName: 'treatment', value: { x: 1 } })

    const b = createExperimentsClient()
    b.absorb(responseWith(a.toHeaders()))

    expect(b.snapshot()).toEqual(a.snapshot())
  })

  it('routes a conflicting write to the injected reporter', () => {
    const onCollision = vi.fn()
    const client = createExperimentsClient({ onCollision })

    client.set('exp', { value: { a: 1 } })
    client.set('exp', { value: { a: 2 } })

    expect(onCollision).toHaveBeenCalledTimes(1)
    expect(client.get('exp')).toEqual({ value: { a: 1 } })
  })

  it('clears the active set', () => {
    const client = createExperimentsClient()
    client.set('exp', { value: { a: 1 } })
    client.clear()

    expect(client.snapshot()).toEqual({})
  })
})

describe('shared client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns a stable singleton', async () => {
    const { getExperimentsClient } = await import('./client')
    expect(getExperimentsClient()).toBe(getExperimentsClient())
  })

  it('routes collisions to a reporter configured after first use', async () => {
    const { getExperimentsClient, configureExperiments } = await import('./client')
    const reporter = vi.fn()

    const client = getExperimentsClient()
    client.set('exp', { value: { a: 1 } })
    configureExperiments({ onCollision: reporter })
    client.set('exp', { value: { a: 2 } })

    expect(reporter).toHaveBeenCalledTimes(1)
  })

  it('falls back to a logged warning when unconfigured', async () => {
    const { logger } = await import('utilities/src/logger/logger')
    const { getExperimentsClient } = await import('./client')

    const client = getExperimentsClient()
    client.set('exp', { value: { a: 1 } })
    client.set('exp', { value: { a: 2 } })

    expect(logger.warn).toHaveBeenCalledTimes(1)
  })
})
