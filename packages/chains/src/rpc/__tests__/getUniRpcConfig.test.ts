import { describe, expect, it, vi } from 'vitest'
import { createUniRpcConfigResolver } from '../getUniRpcConfig'
import { UniverseChainId } from '../types'

const BASE_CTX = {
  getEntryGatewayUrl: (): string => 'https://gateway.example',
  requestSource: 'uniswap-web',
}

describe('createUniRpcConfigResolver', () => {
  it('returns config with request-source header when the flag getter is true', () => {
    const resolve = createUniRpcConfigResolver({ ...BASE_CTX, getFeatureFlag: () => true })

    const config = resolve({ chainId: UniverseChainId.Mainnet })

    expect(config).toEqual({
      rpcUrl: `https://gateway.example/rpc/${UniverseChainId.Mainnet}`,
      headers: { 'x-request-source': 'uniswap-web' },
      getRequestHeaders: undefined,
      credentials: undefined,
    })
  })

  it('returns null when the flag getter is false', () => {
    const resolve = createUniRpcConfigResolver({ ...BASE_CTX, getFeatureFlag: () => false })

    expect(resolve({ chainId: UniverseChainId.Mainnet })).toBeNull()
  })

  it('passes the chainId to the flag getter so callers can decide per chain', () => {
    // Caller-owned policy: on for Arc, off for everything else.
    const getFeatureFlag = vi.fn((chainId: UniverseChainId) => chainId === UniverseChainId.Arc)
    const resolve = createUniRpcConfigResolver({ ...BASE_CTX, getFeatureFlag })

    expect(resolve({ chainId: UniverseChainId.Arc })?.rpcUrl).toBe(`https://gateway.example/rpc/${UniverseChainId.Arc}`)
    expect(resolve({ chainId: UniverseChainId.Mainnet })).toBeNull()
    expect(getFeatureFlag).toHaveBeenCalledWith(UniverseChainId.Arc)
    expect(getFeatureFlag).toHaveBeenCalledWith(UniverseChainId.Mainnet)
  })

  it('forwards session auth wiring (headers + credentials) when enabled', () => {
    const getRequestHeaders = async (): Promise<Record<string, string>> => ({ 'X-Session-ID': 'session' })
    const resolve = createUniRpcConfigResolver({
      ...BASE_CTX,
      getFeatureFlag: () => true,
      getRequestHeaders,
      credentials: 'include',
    })

    const config = resolve({ chainId: UniverseChainId.Robinhood })
    expect(config?.getRequestHeaders).toBe(getRequestHeaders)
    expect(config?.credentials).toBe('include')
  })
})
