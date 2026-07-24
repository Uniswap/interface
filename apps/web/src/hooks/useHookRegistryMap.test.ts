import { HookListResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { HookEntry, HookFlags } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { describe, expect, it } from 'vitest'
import { buildHookRegistryMap, getHookRegistryKey } from '~/hooks/useHookRegistryMap'

const HOOK_BASE = new HookEntry({
  address: '0x1111111111111111111111111111111111111111',
  chain: 'Base',
  chainId: 8453,
  name: 'BaseHook',
  description: 'A hook on Base',
  verifiedSource: true,
  flags: new HookFlags({ beforeSwap: true, afterSwap: true }),
})

const HOOK_ETH = new HookEntry({
  address: '0x2222222222222222222222222222222222222222',
  chain: 'Ethereum',
  chainId: 1,
  name: 'EthHook',
  verifiedSource: false,
})

describe('getHookRegistryKey', () => {
  it('lowercases the hook address', () => {
    expect(getHookRegistryKey({ chainId: 1, hookAddress: '0xABCDEF' })).toBe('1-0xabcdef')
  })

  it('produces the same key regardless of address casing', () => {
    const lower = getHookRegistryKey({ chainId: 8453, hookAddress: HOOK_BASE.address })
    const upper = getHookRegistryKey({ chainId: 8453, hookAddress: HOOK_BASE.address.toUpperCase() })
    expect(lower).toBe(upper)
  })

  it('distinguishes the same address on different chains', () => {
    expect(getHookRegistryKey({ chainId: 1, hookAddress: HOOK_BASE.address })).not.toBe(
      getHookRegistryKey({ chainId: 8453, hookAddress: HOOK_BASE.address }),
    )
  })
})

describe('buildHookRegistryMap', () => {
  it('keys each entry by chainId and lowercased address', () => {
    const map = buildHookRegistryMap(new HookListResponse({ hooks: [HOOK_BASE, HOOK_ETH] }))

    expect(map.size).toBe(2)
    expect(map.get(getHookRegistryKey({ chainId: 8453, hookAddress: HOOK_BASE.address }))?.name).toBe('BaseHook')
    expect(map.get(getHookRegistryKey({ chainId: 1, hookAddress: HOOK_ETH.address }))?.name).toBe('EthHook')
  })

  it('resolves lookups with differently-cased addresses', () => {
    const map = buildHookRegistryMap(new HookListResponse({ hooks: [HOOK_BASE] }))

    const entry = map.get(getHookRegistryKey({ chainId: 8453, hookAddress: HOOK_BASE.address.toUpperCase() }))
    expect(entry?.name).toBe('BaseHook')
  })

  it('does not match an entry on the wrong chain', () => {
    const map = buildHookRegistryMap(new HookListResponse({ hooks: [HOOK_BASE] }))

    expect(map.get(getHookRegistryKey({ chainId: 1, hookAddress: HOOK_BASE.address }))).toBeUndefined()
  })

  it('returns an empty map for an empty registry', () => {
    expect(buildHookRegistryMap(new HookListResponse({ hooks: [] })).size).toBe(0)
  })
})
