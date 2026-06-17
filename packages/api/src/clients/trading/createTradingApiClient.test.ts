import {
  TRADING_API_PATHS,
  V1_TRADING_API_PATHS,
  getVersionedTradingApiPaths,
} from '@universe/api/src/clients/trading/createTradingApiClient'
import { describe, expect, it } from 'vitest'

describe('getVersionedTradingApiPaths', () => {
  it('prefixes top-level string paths with the given prefix', () => {
    const paths = getVersionedTradingApiPaths('/v1')

    expect(paths.quote).toBe('/v1/quote')
    expect(paths.approval).toBe('/v1/check_approval')
    expect(paths.swappableTokens).toBe('/v1/swappable_tokens')
  })

  it('prefixes nested string paths recursively', () => {
    const paths = getVersionedTradingApiPaths('/v1')

    expect(paths.wallet.checkDelegation).toBe('/v1/wallet/check_delegation')
    expect(paths.wallet.encode7702).toBe('/v1/wallet/encode_7702')
    expect(paths.wallet.encode4337).toBe('/v1/wallet/encode_4337')
  })

  it('respects a custom prefix', () => {
    const paths = getVersionedTradingApiPaths('/v2')

    expect(paths.quote).toBe('/v2/quote')
    expect(paths.wallet.checkDelegation).toBe('/v2/wallet/check_delegation')
  })

  it('does not mutate the original TRADING_API_PATHS', () => {
    getVersionedTradingApiPaths('/v1')

    expect(TRADING_API_PATHS.quote).toBe('quote')
    expect(TRADING_API_PATHS.wallet.checkDelegation).toBe('wallet/check_delegation')
  })

  it('preserves the full set of keys', () => {
    const paths = getVersionedTradingApiPaths('/v1')

    expect(Object.keys(paths)).toEqual(Object.keys(TRADING_API_PATHS))
    expect(Object.keys(paths.wallet)).toEqual(Object.keys(TRADING_API_PATHS.wallet))
  })

  it('matches the exported V1_TRADING_API_PATHS', () => {
    expect(getVersionedTradingApiPaths('/v1')).toEqual(V1_TRADING_API_PATHS)
  })
})
