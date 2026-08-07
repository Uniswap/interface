import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2 } from 'uniswap/src/test/fixtures/gql/assets/constants'
import { LP_INCENTIVES_CLAIM_STALENESS_MS } from '~/features/Liquidity/LPIncentives/constants'
import {
  lpIncentivesClaimedKey,
  selectRecentlyClaimedKeys,
  useLpIncentivesClaimedStore,
} from '~/features/Liquidity/LPIncentives/lpIncentivesClaimedStore'

const UNI = '0xABCDEF0000000000000000000000000000000000'
const UNI_LOWERCASE = '0xabcdef0000000000000000000000000000000000'

function key(walletAddress: string, chainId: UniverseChainId): string {
  return lpIncentivesClaimedKey({ walletAddress, chainId, tokenAddress: UNI })
}

function claim(walletAddress: string, chainId: UniverseChainId, now: number): void {
  useLpIncentivesClaimedStore.getState().markClaimed({ walletAddress, chainId, tokenAddresses: [UNI], now })
}

describe('lpIncentivesClaimedStore', () => {
  // Fake timers for every case: `markClaimed` arms the module-scoped prune timeout, and the cases
  // below claim at fixed epoch-relative timestamps, so a real timer would be armed with a zero
  // delay and fire during a later case. Restoring real timers discards it.
  beforeEach(() => {
    vi.useFakeTimers()
    useLpIncentivesClaimedStore.setState({ claimedAt: {} })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns only keys claimed within the staleness window', () => {
    const now = 1_000_000
    const claimedAt = {
      recent: now - 1000,
      stale: now - LP_INCENTIVES_CLAIM_STALENESS_MS - 1,
    }
    const keys = selectRecentlyClaimedKeys(claimedAt, now)
    expect(keys.has('recent')).toBe(true)
    expect(keys.has('stale')).toBe(false)
  })

  it('markClaimed records a lowercased wallet:chain:token key per token', () => {
    const now = 5_000_000
    claim(SAMPLE_SEED_ADDRESS_1, UniverseChainId.Base, now)

    const { claimedAt } = useLpIncentivesClaimedStore.getState()
    expect(claimedAt[key(SAMPLE_SEED_ADDRESS_1, UniverseChainId.Base)]).toBe(now)
    expect(claimedAt[`${SAMPLE_SEED_ADDRESS_1.toLowerCase()}:${UniverseChainId.Base}:${UNI_LOWERCASE}`]).toBe(now)
  })

  // Regression: an unscoped chain:token key let one wallet's claim suppress the same reward token
  // for every other wallet in the browser, since the store is persisted.
  it('scopes a claim to the claiming wallet', () => {
    const now = 5_000_000
    claim(SAMPLE_SEED_ADDRESS_1, UniverseChainId.Mainnet, now)

    const recentlyClaimed = selectRecentlyClaimedKeys(useLpIncentivesClaimedStore.getState().claimedAt, now)
    expect(recentlyClaimed.has(key(SAMPLE_SEED_ADDRESS_1, UniverseChainId.Mainnet))).toBe(true)
    expect(recentlyClaimed.has(key(SAMPLE_SEED_ADDRESS_2, UniverseChainId.Mainnet))).toBe(false)
  })

  it('drops expired entries when a later claim is recorded, keeping the persisted blob bounded', () => {
    const stale = 1_000_000
    useLpIncentivesClaimedStore.setState({
      claimedAt: { [key(SAMPLE_SEED_ADDRESS_1, UniverseChainId.Mainnet)]: stale },
    })

    claim(SAMPLE_SEED_ADDRESS_1, UniverseChainId.Base, stale + LP_INCENTIVES_CLAIM_STALENESS_MS + 1)

    expect(Object.keys(useLpIncentivesClaimedStore.getState().claimedAt)).toEqual([
      key(SAMPLE_SEED_ADDRESS_1, UniverseChainId.Base),
    ])
  })

  it('leaves the claimedAt reference untouched when a prune finds nothing expired', () => {
    const now = 2_000_000
    useLpIncentivesClaimedStore.setState({ claimedAt: { [key(SAMPLE_SEED_ADDRESS_1, UniverseChainId.Mainnet)]: now } })
    const before = useLpIncentivesClaimedStore.getState().claimedAt

    useLpIncentivesClaimedStore.getState().pruneExpired(now + 1)

    expect(useLpIncentivesClaimedStore.getState().claimedAt).toBe(before)
  })

  // The suppression window has to expire on its own: nothing else recomputes when it lapses, so a
  // suppressed reward would otherwise stay hidden for the life of the tab.
  it('expires a claim on its own once the staleness window elapses', () => {
    claim(SAMPLE_SEED_ADDRESS_1, UniverseChainId.Mainnet, Date.now())
    expect(useLpIncentivesClaimedStore.getState().claimedAt).not.toEqual({})

    vi.advanceTimersByTime(LP_INCENTIVES_CLAIM_STALENESS_MS + 1)

    expect(useLpIncentivesClaimedStore.getState().claimedAt).toEqual({})
  })
})
