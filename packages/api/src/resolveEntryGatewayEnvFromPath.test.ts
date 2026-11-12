import { Environment } from '@universe/environment'
import { describe, expect, it } from 'vitest'
import { resolveEntryGatewayEnvFromPath } from './getEntryGatewayUrl'

describe('resolveEntryGatewayEnvFromPath', () => {
  it('decodes each segment the encoder emits', () => {
    expect(resolveEntryGatewayEnvFromPath('/prod/a/b')).toEqual({
      env: Environment.Production,
      remainingPath: '/a/b',
    })
    expect(resolveEntryGatewayEnvFromPath('/staging/a')).toEqual({ env: Environment.Staging, remainingPath: '/a' })
    expect(resolveEntryGatewayEnvFromPath('/dev/a')).toEqual({ env: Environment.Development, remainingPath: '/a' })
  })

  it('leaves an unpinned path whole', () => {
    expect(resolveEntryGatewayEnvFromPath('/v1/sessions')).toEqual({ remainingPath: '/v1/sessions' })
  })

  // The key comes from a URL. A plain object would resolve these to inherited
  // values and strip the segment as though it named an environment.
  it('does not resolve inherited object keys as environments', () => {
    for (const key of ['constructor', '__proto__', 'toString', 'valueOf', 'hasOwnProperty']) {
      expect(resolveEntryGatewayEnvFromPath(`/${key}/x`)).toEqual({ remainingPath: `/${key}/x` })
    }
  })

  it('matches whole segments only', () => {
    expect(resolveEntryGatewayEnvFromPath('/production.v1.Service/Call')).toEqual({
      remainingPath: '/production.v1.Service/Call',
    })
  })

  it('normalizes a missing leading slash', () => {
    expect(resolveEntryGatewayEnvFromPath('prod/a')).toEqual({ env: Environment.Production, remainingPath: '/a' })
  })

  it('handles a bare env segment', () => {
    expect(resolveEntryGatewayEnvFromPath('/prod')).toEqual({ env: Environment.Production, remainingPath: '/' })
  })
})
