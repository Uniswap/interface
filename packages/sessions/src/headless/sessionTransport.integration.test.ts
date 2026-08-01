// @vitest-environment node
// Real staging-backend integration tests for the session-authed viem transport.
// Runs in the optional `test:integration:backend` target, not the unit `test` target —
// same gating as headlessSessionClient.integration.test.ts.
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createFileSessionStore } from '@universe/sessions/src/headless/createFileSessionStore'
import {
  createHeadlessSessionClient,
  DEFAULT_GATEWAY_BASE_URL,
} from '@universe/sessions/src/headless/createHeadlessSessionClient'
import { createSessionTransport } from '@universe/sessions/src/headless/createSessionTransport'
import type { Transport } from 'viem'
import { hexToBigInt, hexToNumber, isHex } from 'viem'
import { mainnet } from 'viem/chains'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const MAINNET_RPC_URL = `${DEFAULT_GATEWAY_BASE_URL}/rpc/1`
// USDC (mainnet) — decimals() is an immutable constant, so the eth_call assertion is stable.
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DECIMALS_SELECTOR = '0x313ce567'

/** Boundary parse: the JSON-RPC result must be a hex quantity for these assertions to mean anything. */
function toHex(value: unknown): `0x${string}` {
  if (!isHex(value)) {
    throw new Error(`Expected hex JSON-RPC result, got: ${JSON.stringify(value)}`)
  }
  return value
}

describe('Real Backend Integration - Session-authed viem transport', () => {
  let dir: string
  let transport: ReturnType<Transport>

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'uniswap-session-transport-'))
    const store = createFileSessionStore({ filePath: join(dir, 'session.json') })
    const client = createHeadlessSessionClient({
      sessionStorage: store.sessionStorage,
      deviceIdService: store.deviceIdService,
    })
    transport = createSessionTransport({ client })(mainnet.id)({ chain: mainnet })
  }, 60_000)

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('a session-less request to the gateway is rejected with 401', async () => {
    const response = await fetch(MAINNET_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-request-source': 'uniswap-extension' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
    })
    expect(response.status).toBe(401)
  })

  it('eth_blockNumber succeeds through the session-authed transport', { timeout: 60_000, retry: 3 }, async () => {
    const blockNumber = await transport.request({ method: 'eth_blockNumber', params: [] })
    expect(hexToBigInt(toHex(blockNumber))).toBeGreaterThan(0n)
  })

  it('eth_chainId returns mainnet', { timeout: 30_000, retry: 3 }, async () => {
    const chainId = await transport.request({ method: 'eth_chainId', params: [] })
    expect(hexToNumber(toHex(chainId))).toBe(mainnet.id)
  })

  it('eth_call reads USDC decimals()', { timeout: 30_000, retry: 3 }, async () => {
    const result = await transport.request({
      method: 'eth_call',
      params: [{ to: USDC_ADDRESS, data: DECIMALS_SELECTOR }, 'latest'],
    })
    expect(hexToBigInt(toHex(result))).toBe(6n)
  })
})
