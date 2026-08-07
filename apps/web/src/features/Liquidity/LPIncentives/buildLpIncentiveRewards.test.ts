import { RewardBalance, Token } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { buildLpIncentiveRewards } from '~/features/Liquidity/LPIncentives/buildLpIncentiveRewards'

const UNI_MAINNET = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const USDC_MAINNET = getPrimaryStablecoin(UniverseChainId.Mainnet).address
const USDC_BASE = getPrimaryStablecoin(UniverseChainId.Base).address

type BuildArgs = Parameters<typeof buildLpIncentiveRewards>[0]
type Balance = BuildArgs['balances'][number]

// Built as real protobuf messages rather than object literals: the dust filter turns on
// `unclaimed_amount_usd` being `optional` in the proto, so an omitted price has to deserialize to
// `undefined` and not to a `0` that the filter would drop as dust. A cast would hide a regression
// there — see the presence test at the bottom of this file.
function balance(chainId: number, address: string, unclaimedAmountUsd?: number): Balance {
  return new RewardBalance({
    token: new Token({ chainId, address, decimals: 18, symbol: 'TKN', name: 'Token' }),
    unclaimedAmount: '0',
    unclaimedAmountUsd,
  }) as Balance
}

function build(
  balances: Balance[],
  isRewardsLoading = false,
  isRewardsError = false,
): ReturnType<typeof buildLpIncentiveRewards> {
  return buildLpIncentiveRewards({ balances, isRewardsLoading, isRewardsError })
}

describe('buildLpIncentiveRewards', () => {
  it('groups rewards by chain with per-chain subtotals and an overall total', () => {
    const balances = [
      balance(UniverseChainId.Mainnet, UNI_MAINNET, 10),
      balance(UniverseChainId.Mainnet, USDC_MAINNET, 52.34),
      balance(UniverseChainId.Base, USDC_BASE, 81.48),
    ]
    const result = build(balances)

    expect(result.hasRewards).toBe(true)
    expect(result.groups).toHaveLength(2)

    const mainnet = result.groups.find((g) => g.chainId === UniverseChainId.Mainnet)
    const base = result.groups.find((g) => g.chainId === UniverseChainId.Base)
    expect(mainnet?.rows).toHaveLength(2)
    expect(mainnet?.subtotalUsd).toBeCloseTo(62.34)
    expect(base?.rows).toHaveLength(1)
    expect(base?.subtotalUsd).toBeCloseTo(81.48)
    expect(result.totalUsd).toBeCloseTo(143.82)
  })

  it('flattens the surviving reward tokens across chains in group order', () => {
    const balances = [
      balance(UniverseChainId.Mainnet, UNI_MAINNET, 10),
      balance(UniverseChainId.Base, USDC_BASE, 81.48),
      balance(UniverseChainId.Mainnet, USDC_MAINNET, 52.34),
      balance(UniverseChainId.Mainnet, '0xdust', 0.001),
    ]

    // Base subtotals highest ($81.48 vs Mainnet's $62.34), and within Mainnet the larger reward
    // leads — see the ordering test below.
    expect(build(balances).rewardTokens).toEqual([
      { chainId: UniverseChainId.Base, address: USDC_BASE },
      { chainId: UniverseChainId.Mainnet, address: USDC_MAINNET },
      { chainId: UniverseChainId.Mainnet, address: UNI_MAINNET },
    ])
  })

  // Regression: group and row order used to follow the backend array, so a refetch that reordered
  // `rewardBalances` reshuffled the modal rows and the logo cluster.
  it('orders groups and rows by value regardless of the backend order', () => {
    const ordered = build([
      balance(UniverseChainId.Mainnet, USDC_MAINNET, 52.34),
      balance(UniverseChainId.Mainnet, UNI_MAINNET, 10),
      balance(UniverseChainId.Base, USDC_BASE, 81.48),
    ])
    const reversed = build([
      balance(UniverseChainId.Base, USDC_BASE, 81.48),
      balance(UniverseChainId.Mainnet, UNI_MAINNET, 10),
      balance(UniverseChainId.Mainnet, USDC_MAINNET, 52.34),
    ])

    expect(ordered.groups.map((g) => g.chainId)).toEqual([UniverseChainId.Base, UniverseChainId.Mainnet])
    expect(ordered.groups[1]?.rows.map((r) => r.usdValue)).toEqual([52.34, 10])
    expect(reversed).toEqual(ordered)
  })

  it('breaks equal-value ties on token address so the order stays stable', () => {
    const addresses = (balances: Balance[]): string[] =>
      build(balances).groups.flatMap((group) => group.rows.map((row) => row.token.address))

    const forward = addresses([
      balance(UniverseChainId.Mainnet, '0xaaa', 5),
      balance(UniverseChainId.Mainnet, '0xbbb', 5),
    ])

    expect(forward).toEqual(['0xaaa', '0xbbb'])
    expect(
      addresses([balance(UniverseChainId.Mainnet, '0xbbb', 5), balance(UniverseChainId.Mainnet, '0xaaa', 5)]),
    ).toEqual(forward)
  })

  it('drops sub-$0.01 dust rewards', () => {
    const result = build([balance(UniverseChainId.Mainnet, UNI_MAINNET, 0.001)])

    expect(result.hasRewards).toBe(false)
    expect(result.groups).toHaveLength(0)
    expect(result.totalUsd).toBe(0)
  })

  // Dropping unpriced rewards would leave a real balance unclaimable: the modal builds both its
  // per-row and per-chain "Collect all" token sets from these rows.
  it('keeps rewards the backend could not price so they stay claimable', () => {
    const result = build([balance(UniverseChainId.Mainnet, UNI_MAINNET, undefined)])

    expect(result.hasRewards).toBe(true)
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0]?.rows).toEqual([expect.objectContaining({ usdValue: undefined })])
    expect(result.rewardTokens).toEqual([{ chainId: UniverseChainId.Mainnet, address: UNI_MAINNET }])
  })

  it('leaves unpriced rewards out of the subtotals and total', () => {
    const result = build([
      balance(UniverseChainId.Mainnet, UNI_MAINNET, undefined),
      balance(UniverseChainId.Mainnet, USDC_MAINNET, 52.34),
    ])

    expect(result.groups[0]?.subtotalUsd).toBeCloseTo(52.34)
    expect(result.totalUsd).toBeCloseTo(52.34)
  })

  it('sorts unpriced rewards after priced ones', () => {
    const result = build([
      balance(UniverseChainId.Mainnet, '0xaaa', undefined),
      balance(UniverseChainId.Mainnet, USDC_MAINNET, 0.02),
    ])

    expect(result.groups[0]?.rows.map((row) => row.token.address)).toEqual([USDC_MAINNET, '0xaaa'])
  })

  it('reports the rewards query loading state', () => {
    expect(build([], true).isLoading).toBe(true)
    expect(build([], false).isLoading).toBe(false)
  })

  // A failed fetch means the balance is unknown, not zero — the cards render greyed rather than
  // hiding, so they need to tell the two apart.
  it('reports the rewards query error state separately from having no rewards', () => {
    const errored = build([], false, true)

    expect(errored.isError).toBe(true)
    expect(errored.hasRewards).toBe(false)
    expect(build([], false, false).isError).toBe(false)
  })

  it('has no rewards for an empty balance list', () => {
    const result = build([])

    expect(result.hasRewards).toBe(false)
    expect(result.groups).toHaveLength(0)
    expect(result.totalUsd).toBe(0)
  })

  // Guards the proto contract the dust filter depends on. `unclaimed_amount_usd` is declared
  // `optional double`, so an absent price deserializes to `undefined`. Were it regenerated as a
  // plain proto3 `double`, protobuf-es would default it to 0, `0 < $0.01` would drop every unpriced
  // reward as dust, and the reward would go silently unclaimable — this fails first if that happens.
  it('deserializes an absent price as undefined, not 0, so unpriced rewards survive the dust filter', () => {
    const unpriced = new RewardBalance({ unclaimedAmount: '0' })

    expect(unpriced.unclaimedAmountUsd).toBeUndefined()
    expect(RewardBalance.fromBinary(unpriced.toBinary()).unclaimedAmountUsd).toBeUndefined()
  })
})
