import { renderHook } from '@testing-library/react'
import { GetRewardsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useGetPoolsRewards } from 'uniswap/src/data/apiClients/dataApiService/pools/getPoolsRewards'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2 } from 'uniswap/src/test/fixtures/gql/assets/constants'
import { useLpIncentiveRewards } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewards'
import { useLpIncentivesClaimedStore } from '~/features/Liquidity/LPIncentives/lpIncentivesClaimedStore'
import { mocked } from '~/test-utils/mocked'

vi.mock('uniswap/src/data/apiClients/dataApiService/pools/getPoolsRewards', () => ({
  useGetPoolsRewards: vi.fn(),
}))

const UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const UNSUPPORTED_CHAIN_ID = 999_999

function mockRewardBalances(
  balances: { chainId: number; address: string; unclaimedAmountUsd?: number }[],
  isLoading = false,
): void {
  mocked(useGetPoolsRewards).mockReturnValue({
    data: {
      rewardBalances: balances.map(({ chainId, address, unclaimedAmountUsd }) => ({
        token: { chainId, address },
        unclaimedAmountUsd,
      })),
    } as unknown as GetRewardsResponse,
    isLoading,
    isError: false,
  } as unknown as ReturnType<typeof useGetPoolsRewards>)
}

function mockRewardsError(): void {
  mocked(useGetPoolsRewards).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
  } as unknown as ReturnType<typeof useGetPoolsRewards>)
}

describe('useLpIncentiveRewards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLpIncentivesClaimedStore.setState({ claimedAt: {} })
  })

  it('groups priced rewards for the wallet', () => {
    mockRewardBalances([{ chainId: UniverseChainId.Mainnet, address: UNI, unclaimedAmountUsd: 12.5 }])

    const { result } = renderHook(() => useLpIncentiveRewards(SAMPLE_SEED_ADDRESS_1))

    expect(result.current.hasRewards).toBe(true)
    expect(result.current.totalUsd).toBeCloseTo(12.5)
    expect(result.current.groups).toHaveLength(1)
  })

  it('drops rewards on chains the app does not support', () => {
    mockRewardBalances([{ chainId: UNSUPPORTED_CHAIN_ID, address: UNI, unclaimedAmountUsd: 12.5 }])

    const { result } = renderHook(() => useLpIncentiveRewards(SAMPLE_SEED_ADDRESS_1))

    expect(result.current.hasRewards).toBe(false)
  })

  it('suppresses a token this wallet just claimed while Merkl still reports it', () => {
    mockRewardBalances([{ chainId: UniverseChainId.Mainnet, address: UNI, unclaimedAmountUsd: 12.5 }])
    useLpIncentivesClaimedStore.getState().markClaimed({
      walletAddress: SAMPLE_SEED_ADDRESS_1,
      chainId: UniverseChainId.Mainnet,
      tokenAddresses: [UNI],
      now: Date.now(),
    })

    const { result } = renderHook(() => useLpIncentiveRewards(SAMPLE_SEED_ADDRESS_1))

    expect(result.current.hasRewards).toBe(false)
  })

  // Regression: the suppression key used to be chain+token only, so one wallet's claim hid another
  // wallet's genuinely unclaimed reward for the length of the staleness window.
  it('keeps showing the reward to a different wallet in the same browser', () => {
    mockRewardBalances([{ chainId: UniverseChainId.Mainnet, address: UNI, unclaimedAmountUsd: 12.5 }])
    useLpIncentivesClaimedStore.getState().markClaimed({
      walletAddress: SAMPLE_SEED_ADDRESS_1,
      chainId: UniverseChainId.Mainnet,
      tokenAddresses: [UNI],
      now: Date.now(),
    })

    const { result } = renderHook(() => useLpIncentiveRewards(SAMPLE_SEED_ADDRESS_2))

    expect(result.current.hasRewards).toBe(true)
    expect(result.current.totalUsd).toBeCloseTo(12.5)
  })

  it('has no rewards without a connected wallet', () => {
    mockRewardBalances([{ chainId: UniverseChainId.Mainnet, address: UNI, unclaimedAmountUsd: 12.5 }])

    const { result } = renderHook(() => useLpIncentiveRewards(undefined))

    expect(result.current.hasRewards).toBe(false)
    expect(result.current.totalUsd).toBe(0)
  })

  // A failed fetch leaves the balance unknown, not zero: the Positions card renders greyed and
  // uncollectable instead of disappearing, which needs isError to be distinguishable.
  it('reports a failed rewards fetch distinctly from having no rewards', () => {
    mockRewardsError()

    const { result } = renderHook(() => useLpIncentiveRewards(SAMPLE_SEED_ADDRESS_1))

    expect(result.current.isError).toBe(true)
    expect(result.current.hasRewards).toBe(false)
    expect(result.current.totalUsd).toBe(0)
  })

  it('reports the rewards query loading state', () => {
    mockRewardBalances([], true)

    const { result } = renderHook(() => useLpIncentiveRewards(SAMPLE_SEED_ADDRESS_1))

    expect(result.current.isLoading).toBe(true)
  })
})
