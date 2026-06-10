import type { Transport } from 'viem'
import { describe, expect, test, vi } from 'vitest'
import { createUniRpcRoutedTransport } from './createUniRpcRoutedTransport'
import type { RpcConfig } from './rpcUrlSelector'

type FakeInstance = { request: (args: { method: string; params?: unknown }) => Promise<unknown> }

// A stand-in viem Transport: records which requests it served under `label`.
function fakeTransport(label: string, calls: string[]): Transport {
  return (() => ({
    request: async (args: { method: string }) => {
      calls.push(`${label}:${args.method}`)
      return label
    },
    config: {},
    value: undefined,
  })) as unknown as Transport
}

// viem Transports are called with a config object to produce the instance.
function instantiate(transport: Transport): FakeInstance {
  return (transport as unknown as (config: Record<string, unknown>) => FakeInstance)({})
}

const UNIRPC: RpcConfig = { rpcUrl: 'https://gateway/rpc/1', isUniRpc: true }
const LEGACY: RpcConfig = { rpcUrl: 'https://legacy/rpc' }

describe('createUniRpcRoutedTransport', () => {
  test('routes to legacy when the resolved config is not UniRPC', async () => {
    const calls: string[] = []
    const inst = instantiate(
      createUniRpcRoutedTransport({
        resolveRpcConfig: () => LEGACY,
        buildUniRpcTransport: () => fakeTransport('unirpc', calls),
        buildLegacyTransport: () => fakeTransport('legacy', calls),
      }),
    )
    expect(await inst.request({ method: 'eth_blockNumber' })).toBe('legacy')
    expect(calls).toEqual(['legacy:eth_blockNumber'])
  })

  test('routes to UniRPC when the resolved config is UniRPC', async () => {
    const calls: string[] = []
    const inst = instantiate(
      createUniRpcRoutedTransport({
        resolveRpcConfig: () => UNIRPC,
        buildUniRpcTransport: () => fakeTransport('unirpc', calls),
        buildLegacyTransport: () => fakeTransport('legacy', calls),
      }),
    )
    expect(await inst.request({ method: 'eth_call' })).toBe('unirpc')
    expect(calls).toEqual(['unirpc:eth_call'])
  })

  test('routes to legacy when the resolver returns null', async () => {
    const calls: string[] = []
    const inst = instantiate(
      createUniRpcRoutedTransport({
        resolveRpcConfig: () => null,
        buildUniRpcTransport: () => fakeTransport('unirpc', calls),
        buildLegacyTransport: () => fakeTransport('legacy', calls),
      }),
    )
    expect(await inst.request({ method: 'eth_chainId' })).toBe('legacy')
  })

  test('self-heals: flips legacy → UniRPC when the gate resolves mid-session', async () => {
    // The regression guard for the UniRPC-gate-before-Statsig bug: a client
    // built while the resolver returned legacy MUST start using UniRPC once the
    // gate resolves — with no rebuild. Pre-fix, the choice was snapshotted and
    // pinned to legacy for the whole session.
    const calls: string[] = []
    let config: RpcConfig | null = LEGACY
    const inst = instantiate(
      createUniRpcRoutedTransport({
        resolveRpcConfig: () => config,
        buildUniRpcTransport: () => fakeTransport('unirpc', calls),
        buildLegacyTransport: () => fakeTransport('legacy', calls),
      }),
    )
    expect(await inst.request({ method: 'a' })).toBe('legacy')
    config = UNIRPC // Statsig init completes, gate turns on
    expect(await inst.request({ method: 'b' })).toBe('unirpc')
    expect(await inst.request({ method: 'c' })).toBe('unirpc')
    expect(calls).toEqual(['legacy:a', 'unirpc:b', 'unirpc:c'])
  })

  test('builds each branch transport at most once', async () => {
    const buildUniRpcTransport = vi.fn(() => fakeTransport('unirpc', []))
    const buildLegacyTransport = vi.fn(() => fakeTransport('legacy', []))
    let config: RpcConfig | null = UNIRPC
    const inst = instantiate(
      createUniRpcRoutedTransport({ resolveRpcConfig: () => config, buildUniRpcTransport, buildLegacyTransport }),
    )
    await inst.request({ method: 'a' })
    await inst.request({ method: 'b' })
    config = LEGACY
    await inst.request({ method: 'c' })
    await inst.request({ method: 'd' })
    expect(buildUniRpcTransport).toHaveBeenCalledTimes(1)
    expect(buildLegacyTransport).toHaveBeenCalledTimes(1)
  })

  test('never builds a branch that is never selected', async () => {
    const buildUniRpcTransport = vi.fn(() => fakeTransport('unirpc', []))
    const buildLegacyTransport = vi.fn(() => fakeTransport('legacy', []))
    const inst = instantiate(
      createUniRpcRoutedTransport({ resolveRpcConfig: () => LEGACY, buildUniRpcTransport, buildLegacyTransport }),
    )
    await inst.request({ method: 'a' })
    expect(buildUniRpcTransport).not.toHaveBeenCalled()
    expect(buildLegacyTransport).toHaveBeenCalledTimes(1)
  })

  test('passes the resolved UniRPC config to its builder', async () => {
    let received: RpcConfig | undefined
    const inst = instantiate(
      createUniRpcRoutedTransport({
        resolveRpcConfig: () => UNIRPC,
        buildUniRpcTransport: (config) => {
          received = config
          return fakeTransport('unirpc', [])
        },
        buildLegacyTransport: () => fakeTransport('legacy', []),
      }),
    )
    await inst.request({ method: 'eth_call' })
    expect(received).toEqual(UNIRPC)
  })

  test('forwards request args and result through the chosen transport', async () => {
    const seen: Array<{ method: string; params?: unknown }> = []
    const recording = (() => ({
      request: async (args: { method: string; params?: unknown }) => {
        seen.push(args)
        return { ok: true }
      },
    })) as unknown as Transport
    const inst = instantiate(
      createUniRpcRoutedTransport({
        resolveRpcConfig: () => UNIRPC,
        buildUniRpcTransport: () => recording,
        buildLegacyTransport: () => fakeTransport('legacy', []),
      }),
    )
    const result = await inst.request({ method: 'eth_getBalance', params: ['0xabc', 'latest'] })
    expect(result).toEqual({ ok: true })
    expect(seen).toEqual([{ method: 'eth_getBalance', params: ['0xabc', 'latest'] }])
  })
})
