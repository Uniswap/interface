import { RewardBalance, Token } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { type FiatNumberType, NumberType } from 'utilities/src/format/types'
import { LP_INCENTIVES_USD_DUST_THRESHOLD } from '~/features/Liquidity/LPIncentives/constants'

export interface LpIncentiveRewardRow {
  token: Token
  // Unset when the backend couldn't price the token. The row is still claimable — see
  // buildLpIncentiveRewards — so the modal renders the symbol in place of a USD figure.
  usdValue?: number
}

export interface LpIncentiveRewardChainGroup {
  chainId: UniverseChainId
  rows: LpIncentiveRewardRow[]
  // Priced rows only; a chain of entirely unpriced rewards subtotals to 0.
  subtotalUsd: number
}

export interface RewardTokenRef {
  chainId: number
  address: string
}

export interface LpIncentiveRewards {
  totalUsd: number
  groups: LpIncentiveRewardChainGroup[]
  // Flattened across chains, in group order — for the logo clusters on the summary cards.
  rewardTokens: RewardTokenRef[]
  isLoading: boolean
  // The rewards fetch failed, so the balance is unknown rather than zero — distinct from
  // `hasRewards: false`, which means the wallet genuinely has nothing to collect. Lets a surface
  // render a greyed, uncollectable state rather than hiding as if there were no rewards.
  isError: boolean
  hasRewards: boolean
}

export type PricedBalance = RewardBalance & { token: Token }

// Sorts unpriced rows last: every priced row that survives the dust filter is >= the threshold,
// so a sentinel below it orders them behind the priced ones.
const UNPRICED_SORT_VALUE = LP_INCENTIVES_USD_DUST_THRESHOLD - 1

// Pure: takes the backend-priced USD value on each balance, drops sub-$0.01 dust rewards, groups
// the survivors by chain with a per-chain subtotal and an overall total. Rewards the backend
// couldn't price are kept — dropping them would leave a real balance with no claim path, since the
// modal builds its claim token sets from these rows — but they contribute nothing to the totals.
// Groups and rows come out highest-value first so a refetch that reorders the backend array
// doesn't reshuffle the modal rows or the logo cluster.
export function buildLpIncentiveRewards({
  balances,
  isRewardsLoading,
  isRewardsError,
}: {
  balances: PricedBalance[]
  isRewardsLoading: boolean
  isRewardsError: boolean
}): LpIncentiveRewards {
  const rowsByChain = new Map<UniverseChainId, LpIncentiveRewardRow[]>()

  balances.forEach((balance) => {
    // Backend leaves unclaimedAmountUsd unset when it can't price the token. Only a known-dust
    // value is dropped; an unknown one isn't assumed to be dust.
    const usdValue = balance.unclaimedAmountUsd
    if (usdValue !== undefined && usdValue < LP_INCENTIVES_USD_DUST_THRESHOLD) {
      return
    }

    const token = balance.token
    const chainId = token.chainId as UniverseChainId
    const rows = rowsByChain.get(chainId) ?? []
    rows.push({ token, usdValue })
    rowsByChain.set(chainId, rows)
  })

  const groups: LpIncentiveRewardChainGroup[] = [...rowsByChain.entries()]
    .map(([chainId, rows]) => {
      // Address breaks value ties so equal-value rewards keep a stable order too.
      const sortedRows = [...rows].sort(
        (a, b) =>
          (b.usdValue ?? UNPRICED_SORT_VALUE) - (a.usdValue ?? UNPRICED_SORT_VALUE) ||
          a.token.address.localeCompare(b.token.address),
      )
      return {
        chainId,
        rows: sortedRows,
        subtotalUsd: sortedRows.reduce((sum, row) => sum + (row.usdValue ?? 0), 0),
      }
    })
    .sort((a, b) => b.subtotalUsd - a.subtotalUsd || a.chainId - b.chainId)

  const totalUsd = groups.reduce((sum, group) => sum + group.subtotalUsd, 0)
  const rewardTokens = groups.flatMap((group) =>
    group.rows.map((row) => ({ chainId: row.token.chainId, address: row.token.address })),
  )

  return {
    totalUsd,
    groups,
    rewardTokens,
    isLoading: isRewardsLoading,
    isError: isRewardsError,
    hasRewards: groups.length > 0,
  }
}

// A failed fetch leaves the balance unknown rather than zero, so the total renders as this instead
// of a formatted $0.00 asserting a balance the wallet may not have. Matches the legacy cards.
export const UNKNOWN_REWARDS_TOTAL = '-'

// The reward total ready for display. Shared by every surface that shows it so the unknown-balance
// representation can't drift between them — a "$0.00" on one surface and a "-" on another would
// disagree about whether the wallet has rewards.
export function formatRewardsTotal(
  rewards: Pick<LpIncentiveRewards, 'isError' | 'totalUsd'>,
  convertFiatAmountFormatted: (value: number, numberType: FiatNumberType) => string,
): string {
  return rewards.isError
    ? UNKNOWN_REWARDS_TOTAL
    : convertFiatAmountFormatted(rewards.totalUsd, NumberType.PortfolioBalance)
}
