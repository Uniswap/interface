import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { CreateViemClient } from './createViemClient'
import { UniverseChainId } from './types'
import { ViemClientManager } from './ViemClientManager'

vi.mock('utilities/src/logger/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const CHAIN_ID = UniverseChainId.Mainnet

// Stand-in for PublicClient so we can compare without dragging viem internals.
// The properties are only used by the test to assert which factory output
// the manager returned.
type StubClient = { __mockUrl: string }

/**
 * Build a factory + flag pair we can flip mid-test. Mirrors the production
 * wiring: createViemClientFactory is called every time the resolver returns
 * a fresh config, so the URL on the returned client tracks whatever the flag
 * said at that exact moment.
 */
function makeFactoryWithToggleableFlag() {
  let useUniRpc = false
  const setFlag = (v: boolean): void => {
    useUniRpc = v
  }
  const createClient: CreateViemClient = vi.fn(() => {
    const url = useUniRpc ? 'https://gateway/rpc/1' : 'https://legacy.example.com'
    return { __mockUrl: url } as unknown as ReturnType<CreateViemClient>
  })
  return { createClient, setFlag }
}

let createClient: CreateViemClient
let setFlag: (v: boolean) => void

beforeEach(() => {
  ;({ createClient, setFlag } = makeFactoryWithToggleableFlag())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ViemClientManager — config-staleness contract', () => {
  test('getViemClient reflects the current rpc config when the flag toggles mid-session', () => {
    // This is the bug a user hits when they (a) open the app before Statsig
    // loads or (b) toggle UniRpcEnabled via the FeatureFlagModal after the
    // saga has already constructed clients. The manager must re-resolve, not
    // hand back a stale client built when the flag was off.
    const manager = new ViemClientManager(createClient)

    setFlag(false)
    const beforeFlip = manager.getViemClient(CHAIN_ID) as unknown as StubClient
    expect(beforeFlip.__mockUrl).toBe('https://legacy.example.com')

    setFlag(true)
    const afterFlip = manager.getViemClient(CHAIN_ID) as unknown as StubClient
    expect(afterFlip.__mockUrl).toBe('https://gateway/rpc/1')
  })

  test('eager createViemClient at app boot does not pin the chain to a stale URL', () => {
    // The wallet saga `initProviders` eagerly calls `createViemClient(chainId)`
    // for every EVM chain at startup. If Statsig hasn't registered yet, the
    // flag read returns false and the legacy URL is captured. Subsequent
    // reads must still pick up the current flag once Statsig is ready.
    const manager = new ViemClientManager(createClient)

    // Simulate the boot-race: flag is false at construction time.
    setFlag(false)
    manager.createViemClient(CHAIN_ID)

    // Later in the session, Statsig is ready and the flag is on.
    setFlag(true)
    const client = manager.getViemClient(CHAIN_ID) as unknown as StubClient

    expect(client.__mockUrl).toBe('https://gateway/rpc/1')
  })
})
