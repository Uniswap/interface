import type { HeadlessSessionClient } from '@universe/sessions/src/headless'
import { DEFAULT_GATEWAY_BASE_URL } from '@universe/sessions/src/headless'
import { describe, expect, it, vi } from 'vitest'
import {
  buildForkArgs,
  createUnirpcForkSourceProvider,
  isUnirpcForkEnabled,
  probeForkAuth,
  resolveForkSourceProvider,
  resolveUnirpcGatewayBaseUrl,
  shouldRelaunchForAuth,
} from '~/playwright/anvil/unirpc-fork'

function createStubSessionClient(overrides?: Partial<HeadlessSessionClient>): HeadlessSessionClient {
  return {
    getSessionHeaders: vi.fn().mockResolvedValue({
      'x-request-source': 'uniswap-extension',
      'X-Session-ID': 'session-1',
      'X-Device-ID': 'device-1',
    }),
    recover: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('isUnirpcForkEnabled', () => {
  it.each(['1', 'true', 'TRUE', 'True'])('is enabled for ANVIL_FORK_VIA_UNIRPC=%s', (value) => {
    expect(isUnirpcForkEnabled({ ANVIL_FORK_VIA_UNIRPC: value })).toBe(true)
  })

  it.each(['0', 'false', '', undefined])('is disabled for ANVIL_FORK_VIA_UNIRPC=%s', (value) => {
    expect(isUnirpcForkEnabled({ ANVIL_FORK_VIA_UNIRPC: value })).toBe(false)
  })
})

describe('resolveUnirpcGatewayBaseUrl', () => {
  it('defaults to the staging entry gateway', () => {
    expect(resolveUnirpcGatewayBaseUrl({})).toBe(DEFAULT_GATEWAY_BASE_URL)
  })

  it('honors ANVIL_UNIRPC_GATEWAY_URL and trims trailing slashes', () => {
    expect(resolveUnirpcGatewayBaseUrl({ ANVIL_UNIRPC_GATEWAY_URL: 'https://gateway.example/' })).toBe(
      'https://gateway.example',
    )
  })
})

describe('resolveForkSourceProvider (flag routing)', () => {
  it('routes to the static provider when the flag is off', async () => {
    const provider = resolveForkSourceProvider({ defaultForkUrl: 'https://publicnode.example', env: {} })

    expect(provider.kind).toBe('static')
    await expect(provider.getForkSource()).resolves.toEqual({
      forkUrl: 'https://publicnode.example',
      forkHeaders: {},
    })
  })

  it('routes to the uni RPC provider when the flag is on', () => {
    const provider = resolveForkSourceProvider({
      defaultForkUrl: 'https://publicnode.example',
      env: { ANVIL_FORK_VIA_UNIRPC: '1' },
    })

    expect(provider.kind).toBe('unirpc')
  })
})

describe('createUnirpcForkSourceProvider', () => {
  it('composes the gateway fork URL for the chain and returns the session headers', async () => {
    const sessionClient = createStubSessionClient()
    const provider = createUnirpcForkSourceProvider({
      chainId: 8453,
      env: { ANVIL_UNIRPC_GATEWAY_URL: 'https://gateway.example' },
      sessionClient,
    })

    await expect(provider.getForkSource()).resolves.toEqual({
      forkUrl: 'https://gateway.example/rpc/8453',
      forkHeaders: {
        'x-request-source': 'uniswap-extension',
        'X-Session-ID': 'session-1',
        'X-Device-ID': 'device-1',
      },
    })
  })

  it('defaults to mainnet against the staging gateway', async () => {
    const provider = createUnirpcForkSourceProvider({ env: {}, sessionClient: createStubSessionClient() })

    await expect(provider.getForkSource()).resolves.toMatchObject({
      forkUrl: `${DEFAULT_GATEWAY_BASE_URL}/rpc/1`,
    })
  })

  it('delegates recover() to the session client', async () => {
    const sessionClient = createStubSessionClient()
    const provider = createUnirpcForkSourceProvider({ env: {}, sessionClient })

    await provider.recover()

    expect(sessionClient.recover).toHaveBeenCalledTimes(1)
  })
})

describe('buildForkArgs', () => {
  it('emits --fork-url plus one --fork-header per header', () => {
    expect(
      buildForkArgs({
        forkUrl: 'https://gateway.example/rpc/1',
        forkHeaders: { 'X-Session-ID': 'session-1', 'x-request-source': 'uniswap-extension' },
      }),
    ).toEqual([
      '--fork-url',
      'https://gateway.example/rpc/1',
      '--fork-header',
      'X-Session-ID: session-1',
      '--fork-header',
      'x-request-source: uniswap-extension',
    ])
  })

  it('emits only --fork-url for header-less sources', () => {
    expect(buildForkArgs({ forkUrl: 'https://publicnode.example', forkHeaders: {} })).toEqual([
      '--fork-url',
      'https://publicnode.example',
    ])
  })
})

describe('probeForkAuth / shouldRelaunchForAuth (relaunch decision)', () => {
  const source = { forkUrl: 'https://gateway.example/rpc/1', forkHeaders: { 'X-Session-ID': 'session-1' } }

  it('reports unauthorized on HTTP 401 and requests a relaunch', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('unauthorized', { status: 401 }))

    const probe = await probeForkAuth(source, fetchFn as unknown as typeof fetch)

    expect(probe).toBe('unauthorized')
    expect(shouldRelaunchForAuth(probe)).toBe(true)
    expect(fetchFn).toHaveBeenCalledWith(
      source.forkUrl,
      expect.objectContaining({ headers: expect.objectContaining(source.forkHeaders) }),
    )
  })

  it.each([200, 429, 500, 503])('reports ok (no relaunch) on HTTP %s', async (status) => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('body', { status }))

    const probe = await probeForkAuth(source, fetchFn as unknown as typeof fetch)

    expect(probe).toBe('ok')
    expect(shouldRelaunchForAuth(probe)).toBe(false)
  })

  it('reports unreachable (no relaunch) when the probe request throws', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('network down'))

    const probe = await probeForkAuth(source, fetchFn as unknown as typeof fetch)

    expect(probe).toBe('unreachable')
    expect(shouldRelaunchForAuth(probe)).toBe(false)
  })
})
