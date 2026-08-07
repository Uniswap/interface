import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LP_INCENTIVES_CLAIM_STALENESS_MS } from '~/features/Liquidity/LPIncentives/constants'

const STORAGE_KEY = 'uniswap_lp_incentives_claimed'

// Key a claimed reward by the claiming wallet + distribution chain + token address. The wallet
// scope matters because this store is persisted: without it, one account's claim would suppress
// the same reward token for every other account in the browser.
export function lpIncentivesClaimedKey({
  walletAddress,
  chainId,
  tokenAddress,
}: {
  walletAddress: string
  chainId: number
  tokenAddress: string
}): string {
  return `${walletAddress.toLowerCase()}:${chainId}:${tokenAddress.toLowerCase()}`
}

interface LpIncentivesClaimedState {
  // key -> claim timestamp (ms). Recent entries suppress a just-claimed reward while
  // Merkl's API still reports the stale (non-zero) balance.
  claimedAt: Record<string, number>
  markClaimed: (args: { walletAddress: string; chainId: number; tokenAddresses: string[]; now: number }) => void
  pruneExpired: (now: number) => void
}

// Drops entries outside the staleness window. Returns the same object when nothing expired so a
// no-op prune doesn't re-render subscribers.
function withoutExpired(claimedAt: Record<string, number>, now: number): Record<string, number> {
  const live = Object.entries(claimedAt).filter(([, timestamp]) => now - timestamp < LP_INCENTIVES_CLAIM_STALENESS_MS)
  return live.length === Object.keys(claimedAt).length ? claimedAt : Object.fromEntries(live)
}

let pruneTimeout: ReturnType<typeof setTimeout> | undefined

// Nothing outside this store recomputes when a suppression window lapses, so a single timer armed
// for the earliest expiry does it: the resulting `claimedAt` change is what makes a suppressed
// reward reappear instead of staying hidden for the life of the tab.
function scheduleNextPrune(claimedAt: Record<string, number>, now: number): void {
  if (pruneTimeout !== undefined) {
    clearTimeout(pruneTimeout)
    pruneTimeout = undefined
  }

  const timestamps = Object.values(claimedAt)
  if (timestamps.length === 0) {
    return
  }

  const delay = Math.max(0, Math.min(...timestamps) + LP_INCENTIVES_CLAIM_STALENESS_MS - now)
  pruneTimeout = setTimeout(() => {
    pruneTimeout = undefined
    useLpIncentivesClaimedStore.getState().pruneExpired(Date.now())
  }, delay)
}

export const useLpIncentivesClaimedStore = create<LpIncentivesClaimedState>()(
  persist(
    (set, get) => ({
      claimedAt: {},
      markClaimed: ({ walletAddress, chainId, tokenAddresses, now }) => {
        // Prune while writing so the persisted blob stays bounded by the staleness window rather
        // than accumulating every reward ever claimed in this browser.
        const next = { ...withoutExpired(get().claimedAt, now) }
        tokenAddresses.forEach((tokenAddress) => {
          next[lpIncentivesClaimedKey({ walletAddress, chainId, tokenAddress })] = now
        })
        set({ claimedAt: next })
        scheduleNextPrune(next, now)
      },
      pruneExpired: (now) => {
        const { claimedAt } = get()
        const next = withoutExpired(claimedAt, now)
        if (next !== claimedAt) {
          set({ claimedAt: next })
        }
        scheduleNextPrune(next, now)
      },
    }),
    {
      name: STORAGE_KEY,
      // Entries restored from a previous session are usually already expired; prune them and arm
      // the timer for whatever is left.
      onRehydrateStorage: () => (state) => state?.pruneExpired(Date.now()),
    },
  ),
)

// The set of claimed keys inside the staleness window at `now`. `pruneExpired` keeps the store
// itself bounded, but reads still check the timestamp so a throttled timer can't surface a
// suppressed reward early.
export function selectRecentlyClaimedKeys(claimedAt: Record<string, number>, now: number): Set<string> {
  const keys = new Set<string>()
  for (const [key, timestamp] of Object.entries(claimedAt)) {
    if (now - timestamp < LP_INCENTIVES_CLAIM_STALENESS_MS) {
      keys.add(key)
    }
  }
  return keys
}
