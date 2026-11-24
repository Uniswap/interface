import { renderHook } from '@testing-library/react'
import { getLauncherAddresses, SupportedChainId } from '@uniswap/liquidity-launcher-sdk'
import { areEvmAddressesEqual } from '@universe/chains'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useV4PoolsInitializedOnChain } from '~/features/Liquidity/hooks/useV4PoolsInitializedOnChain'
import { lbpStrategiesForChain, SUPERSEDED_LBP_STRATEGIES } from '~/features/Liquidity/supersededLbpStrategies'
import { TEST_TOKEN_1, TEST_TOKEN_2 } from '~/test-utils/constants'

const { mockUseReadContracts } = vi.hoisted(() => ({ mockUseReadContracts: vi.fn() }))

vi.mock('wagmi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wagmi')>()),
  useReadContracts: mockUseReadContracts,
}))

/** A live auction's initializer, as `registeredPoolIds` returns it for a reserved tier. */
const RESERVED_INITIALIZER = '0x824A3eCDe463DD45cC156b64CEfA132596C9A000'

/**
 * Chains the SDK deploys an LBPStrategy on — the chains a reservation can exist on — each paired
 * with the address the SDK currently points at. Paired here so callers read the address the filter
 * already proved defined instead of re-reading it through an optional chain.
 */
function deployedChains(): { chainId: SupportedChainId; current: string }[] {
  return Object.values(SupportedChainId)
    .filter((value): value is SupportedChainId => typeof value === 'number')
    .flatMap((chainId) => {
      const current = getLauncherAddresses(chainId)?.lbpStrategy
      return current === undefined ? [] : [{ chainId, current }]
    })
}

/**
 * Per-chain expectations, both pinned exactly.
 *
 * `current` is the address `getLauncherAddresses` returns under the pinned SDK, and it is the field
 * that catches a forgotten append: it moves on EVERY rotation. A count cannot, because
 * `lbpStrategiesForChain` returns `1 + superseded.length` — a rotation that re-points the SDK with
 * no append here moves one address from "current" to "never read" and leaves the total unchanged, so
 * a count-only assertion stays green while every reservation on the outgoing strategy goes unread.
 * That is the exact failure this table exists to catch, so the count is not enough on its own.
 *
 * `generations` is the current strategy plus every superseded one, as an exact count rather than a
 * lower bound, because a lower bound pins nothing: every deployed chain has had at least one
 * rotation, so `length > 1` held while seven chains were each a full pre-registry generation short.
 * It still earns its place beside `current` — it is what fails when an append is DROPPED from an
 * entry the SDK has long since moved past, which leaves `current` correct.
 *
 * So a bump past a rotation edits both fields for the chain it touches, in the same change that
 * appends the outgoing address to {@link SUPERSEDED_LBP_STRATEGIES}.
 *
 * Addresses are the pinned SDK's. Counts come from the public LBPStrategy deployment table and the
 * CCA indexer's per-chain strategy history, confirmed on chain.
 */
const EXPECTED_STRATEGIES: Partial<Record<SupportedChainId, { current: string; generations: number }>> = {
  [SupportedChainId.MAINNET]: { current: '0x2EEF0e2a9a652d755AccAD95a24541A98B5CA000', generations: 3 },
  [SupportedChainId.UNICHAIN]: { current: '0x48F55E7E8ac229aA4e2f3F2d44aa9284D86da000', generations: 3 },
  [SupportedChainId.BASE]: { current: '0xf10124B01E9fa88b0a2eF3fA95a53B3310446000', generations: 3 },
  [SupportedChainId.ARBITRUM_ONE]: { current: '0xc80f3f4497CD9ae41bf8cB5C8809620182B6E000', generations: 3 },
  [SupportedChainId.AVALANCHE]: { current: '0x7575c9488AB7913e7749B9F5e02789355699E000', generations: 3 },
  [SupportedChainId.XLAYER]: { current: '0xde758D7B3202b7f4f842E8313Fc04Bf19c6Be000', generations: 3 },
  [SupportedChainId.ROBINHOOD]: { current: '0xbf1aB81f7d534b2CC0Da76fcf4d541322bB0e000', generations: 4 },
  [SupportedChainId.ARC]: { current: '0x542BCDA1015485ef0B1cD11B835DC58DF5102000', generations: 2 },
  // Never rotated: v3.3.0 is the only LBPStrategy deployed on Ink.
  [SupportedChainId.INK]: { current: '0x0cB98d78be96D5119E49664a9F24fDA22f83E000', generations: 1 },
  [SupportedChainId.SEPOLIA]: { current: '0x95434E898Af471945Cab33D5064d2aC1A6Ba2000', generations: 3 },
  [SupportedChainId.BASE_SEPOLIA]: { current: '0x73ad52384798AdADfBe19fCfD28ff09D2CC82000', generations: 3 },
}

describe('lbpStrategiesForChain', () => {
  it('reads the current strategy AND every superseded one', () => {
    const current = getLauncherAddresses(SupportedChainId.MAINNET)?.lbpStrategy
    expect(current).toBeDefined()
    const strategies = lbpStrategiesForChain(SupportedChainId.MAINNET)
    expect(strategies).toContain(current)
    // Both Mainnet generations that still hold reservations for unmigrated auctions.
    expect(strategies).toContain('0x49380c4EfaB1b491006aF7FabAB8B3459F0E6000')
    expect(strategies).toContain('0xb98766A35cdc28415be0767D4EA41e39fBA3e000')
  })

  it('pins every chain the SDK deploys on, so one it adds cannot arrive unnoticed', () => {
    // Closes the hole the two cases below used to leave open. Without an entry a chain sat at the
    // never-rotated count of 1 and had no address to compare, and those are the same shape as
    // "rotated, append forgotten" — so a chain the SDK adds lost BOTH tripwires on its first
    // rotation, silently, on whichever chain nobody was watching. Requiring the entry costs one
    // edit per new chain and makes that edit impossible to skip.
    const unpinned = deployedChains()
      .filter(({ chainId }) => EXPECTED_STRATEGIES[chainId] === undefined)
      .map(({ chainId }) => SupportedChainId[chainId])
    expect(unpinned).toEqual([])
  })

  it('pins each chain’s CURRENT strategy, so a rotation fails even with the append forgotten', () => {
    // The assertion a count cannot make: this value moves on every rotation, appended or not.
    // Compared as one map so a failure names the chain and both addresses, not just a bare mismatch.
    const expected: Record<string, string | undefined> = {}
    const actual: Record<string, string> = {}
    for (const { chainId, current } of deployedChains()) {
      const chainName = SupportedChainId[chainId]
      // An unpinned chain is not skipped: it lands here as a missing expectation and fails, the same
      // way the coverage case above fails. Nothing silently opts a chain out of this comparison.
      // Lowercased both sides: a release that re-checksums the same address is not a rotation.
      expected[chainName] = EXPECTED_STRATEGIES[chainId]?.current.toLowerCase()
      actual[chainName] = current.toLowerCase()
    }
    expect(actual).toEqual(expected)
  })

  it('covers every generation each chain has deployed, not just the current one', () => {
    for (const { chainId } of deployedChains()) {
      // No `?? 1` fallback for an unpinned chain. One generation is both what a chain that has never
      // rotated looks like and what a chain that rotated with the append forgotten looks like, so
      // the fallback asserted the one shape it could never fail on. Coverage is required above; this
      // reads the pin directly.
      expect(lbpStrategiesForChain(chainId).length).toBe(EXPECTED_STRATEGIES[chainId]?.generations)
    }
  })

  it('pins no chain the SDK has stopped deploying on', () => {
    // Keeps the table above honest: a stale key would assert coverage for a chain nothing reads.
    for (const chainId of Object.keys(EXPECTED_STRATEGIES).map(Number)) {
      expect(getLauncherAddresses(chainId)?.lbpStrategy).toBeDefined()
    }
  })

  it('never lists a chain’s CURRENT strategy as superseded', () => {
    // The tripwire for the next SDK bump. Appending the outgoing address is required; appending one
    // the SDK still points at would read the same contract twice and means the append went in early.
    for (const [chainId, superseded] of Object.entries(SUPERSEDED_LBP_STRATEGIES)) {
      const current = getLauncherAddresses(Number(chainId))?.lbpStrategy
      expect(superseded.some((address) => areEvmAddressesEqual(address, current))).toBe(false)
    }
  })

  it('checks nothing on a chain with no launcher deployment', () => {
    expect(lbpStrategiesForChain(999_999)).toEqual([])
    expect(lbpStrategiesForChain(undefined)).toEqual([])
  })
})

/**
 * Candidate tiers for the hook-level reads below. Four of them against Mainnet's three strategy
 * generations, deliberately not square: with equal counts a strategy-major transposition of the
 * flattening lands on the right tier by coincidence for some cells.
 */
const CANDIDATE_TIERS = [
  { feeAmount: 100, tickSpacing: 1 },
  { feeAmount: 500, tickSpacing: 10 },
  { feeAmount: 3000, tickSpacing: 60 },
  { feeAmount: 10_000, tickSpacing: 200 },
]

interface ReadContractsConfig {
  contracts: readonly { functionName: string }[]
}

/**
 * Every candidate pool uninitialized, and reserved only at the given indexes into the FLATTENED
 * reservation reads — so a test can place a reservation on one exact (pool id, generation) cell.
 */
function mockReadsReservedAt(reservedIndexes: number[]): void {
  mockUseReadContracts.mockImplementation(({ contracts }: ReadContractsConfig) => {
    if (contracts[0]?.functionName === 'getSlot0') {
      return {
        data: contracts.map(() => ({ status: 'success', result: [0n, 0, 0, 0] })),
        isLoading: false,
        isError: false,
      }
    }
    return {
      data: contracts.map((_, index) => ({
        status: 'success',
        result: reservedIndexes.includes(index) ? RESERVED_INITIALIZER : ZERO_ADDRESS,
      })),
      isLoading: false,
      isError: false,
    }
  })
}

function renderFeeTierGate(): { unavailableFeeTierKeys: Set<string>; isError: boolean } {
  const { result } = renderHook(() =>
    useV4PoolsInitializedOnChain({
      chainId: SupportedChainId.MAINNET,
      sdkCurrencies: { TOKEN0: TEST_TOKEN_1, TOKEN1: TEST_TOKEN_2 },
      feeTiers: CANDIDATE_TIERS,
    }),
  )
  return result.current
}

describe('a tier reserved on a superseded strategy', () => {
  beforeEach(() => {
    mockUseReadContracts.mockReset()
  })

  it('takes the tier that issued the read and no other', () => {
    const generations = lbpStrategiesForChain(SupportedChainId.MAINNET).length
    // The index arithmetic below assumes both counts; a table edit must not quietly change them.
    expect(generations).toBe(3)
    expect(CANDIDATE_TIERS).toHaveLength(4)

    // Two reservations, on the FIRST cell of tier 1's run and the LAST cell of tier 2's. That pair
    // is what makes the flattening itself the thing under test: a strategy-major stride reattributes
    // them to tiers 3 and 0, an offset of +1 moves the first onto tier 0, and an offset of -1 moves
    // the second onto tier 3 — and the assertion is the exact set, so none of the three survives.
    // A reservation on a middle cell would survive both offsets, and an assertion that only counts
    // how many tiers are taken would survive all three — each regression takes exactly two.
    mockReadsReservedAt([1 * generations, 2 * generations + (generations - 1)])

    const { unavailableFeeTierKeys, isError } = renderFeeTierGate()

    expect(unavailableFeeTierKeys).toEqual(new Set(['500-10', '3000-60']))
    expect(isError).toBe(false)
  })

  it('leaves every tier available when no generation holds a reservation', () => {
    // The control the case above needs: without it, a gate that flags nothing at all would still
    // have to be wrong somewhere else to fail, and a gate that flags everything would not be caught.
    mockReadsReservedAt([])

    const { unavailableFeeTierKeys, isError } = renderFeeTierGate()

    expect(unavailableFeeTierKeys).toEqual(new Set())
    expect(isError).toBe(false)
  })
})
