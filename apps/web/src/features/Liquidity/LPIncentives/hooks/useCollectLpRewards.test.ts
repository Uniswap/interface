import type { PayloadAction } from '@reduxjs/toolkit'
import { act, renderHook, waitFor } from '@testing-library/react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures/gql/assets/constants'
import { lpRewardsCollectKey, useCollectLpRewards } from '~/features/Liquidity/LPIncentives/hooks/useCollectLpRewards'
import {
  lpIncentivesClaimedKey,
  useLpIncentivesClaimedStore,
} from '~/features/Liquidity/LPIncentives/lpIncentivesClaimedStore'
import type { LpIncentivesClaimParams } from '~/state/sagas/lp_incentives/types'

const dispatch = vi.fn()
const fetchQuery = vi.fn()

vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useDispatch: (): typeof dispatch => dispatch,
}))

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: (): { fetchQuery: typeof fetchQuery } => ({ fetchQuery }),
}))

vi.mock('~/hooks/useAccount', () => ({
  useAccount: (): { address: string; chainId: UniverseChainId } => ({
    address: SAMPLE_SEED_ADDRESS_1,
    chainId: UniverseChainId.Mainnet,
  }),
}))

vi.mock('~/hooks/useSelectChain', () => ({
  useSelectChain: (): (() => Promise<boolean>) => async () => true,
}))

const UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const COLLECT_ARGS = { chainId: UniverseChainId.Mainnet, tokenAddresses: [UNI] }

// The saga params the hook handed to `dispatch`, so a test can drive the saga's callbacks.
function dispatchedClaimParams(): LpIncentivesClaimParams {
  return (dispatch.mock.calls[0]?.[0] as PayloadAction<LpIncentivesClaimParams>).payload
}

describe('useCollectLpRewards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLpIncentivesClaimedStore.setState({ claimedAt: {} })
    fetchQuery.mockResolvedValue({ claim: { to: '0xdistributor', data: '0xdeadbeef', value: '0' } })
  })

  it('marks the collect action in flight and dispatches the claim', async () => {
    const { result } = renderHook(() => useCollectLpRewards())

    await act(async () => {
      result.current.collect(COLLECT_ARGS)
    })

    expect(result.current.activeKey).toBe(lpRewardsCollectKey(UniverseChainId.Mainnet, [UNI]))
    expect(result.current.isClaiming).toBe(true)
    expect(dispatch).toHaveBeenCalledTimes(1)
  })

  // The suppression store is persisted and shared across accounts, so the claim has to be recorded
  // against the wallet that made it.
  it('records a successful claim against the connected wallet', async () => {
    const { result } = renderHook(() => useCollectLpRewards())

    await act(async () => {
      result.current.collect(COLLECT_ARGS)
    })
    act(() => {
      dispatchedClaimParams().onSuccess()
    })

    const { claimedAt } = useLpIncentivesClaimedStore.getState()
    const expectedKey = lpIncentivesClaimedKey({
      walletAddress: SAMPLE_SEED_ADDRESS_1,
      chainId: UniverseChainId.Mainnet,
      tokenAddress: UNI,
    })
    expect(Object.keys(claimedAt)).toEqual([expectedKey])
    expect(result.current.activeKey).toBeUndefined()
  })

  it('ignores a second collect while one is already in flight', async () => {
    const { result } = renderHook(() => useCollectLpRewards())

    await act(async () => {
      result.current.collect(COLLECT_ARGS)
    })
    await act(async () => {
      result.current.collect(COLLECT_ARGS)
    })

    expect(dispatch).toHaveBeenCalledTimes(1)
  })

  // Regression: the modal calls clearError() on close. If that also cleared `activeKey`, closing
  // mid-claim and reopening would let the guard pass and dispatch a duplicate claim.
  it('keeps the in-flight guard after clearError, so a reopened modal cannot double-claim', async () => {
    const { result } = renderHook(() => useCollectLpRewards())

    await act(async () => {
      result.current.collect(COLLECT_ARGS)
    })
    act(() => {
      result.current.clearError()
    })

    expect(result.current.activeKey).toBe(lpRewardsCollectKey(UniverseChainId.Mainnet, [UNI]))

    await act(async () => {
      result.current.collect(COLLECT_ARGS)
    })

    expect(dispatch).toHaveBeenCalledTimes(1)
  })

  it('surfaces a claim-data failure and releases the guard', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}) // the hook logs the failure
    fetchQuery.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useCollectLpRewards())

    await act(async () => {
      result.current.collect(COLLECT_ARGS)
    })

    await waitFor(() => expect(result.current.error).toBe('boom'))
    expect(result.current.activeKey).toBeUndefined()
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('clears a stale error via clearError', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}) // the hook logs the failure
    fetchQuery.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useCollectLpRewards())

    await act(async () => {
      result.current.collect(COLLECT_ARGS)
    })
    await waitFor(() => expect(result.current.error).toBe('boom'))

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeUndefined()
  })
})
