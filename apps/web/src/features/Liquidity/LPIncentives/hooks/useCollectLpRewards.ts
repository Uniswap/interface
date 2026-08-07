import { useQueryClient } from '@tanstack/react-query'
import { ClaimLPRewardsRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import { Distributor } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { noop } from 'utilities/src/react/noop'
import { useLpIncentivesClaimedStore } from '~/features/Liquidity/LPIncentives/lpIncentivesClaimedStore'
import { useAccount } from '~/hooks/useAccount'
import { useSelectChain } from '~/hooks/useSelectChain'
import { lpIncentivesClaimSaga } from '~/state/sagas/lp_incentives/lpIncentivesSaga'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

interface CollectArgs {
  chainId: number
  tokenAddresses: string[]
}

interface UseCollectLpRewardsResult {
  collect: (args: CollectArgs) => void
  // Identifies the in-flight claim so the modal can show a spinner on that button and disable the rest.
  activeKey?: string
  isClaiming: boolean
  error?: string
  // The modal keeps this hook mounted while closed, so it calls clearError() on close to avoid
  // re-showing a stale error banner on reopen. `activeKey` deliberately survives — clearing it
  // would let a reopened modal dispatch a second claim for a still-in-flight one.
  clearError: () => void
}

// Stable identity for a Collect action (one chain, one or more reward tokens).
export function lpRewardsCollectKey(chainId: number, tokenAddresses: string[]): string {
  return `${chainId}:${tokenAddresses
    .map((address) => address.toLowerCase())
    .sort()
    .join(',')}`
}

// Collects LP-incentive rewards for a single chain (one token or all of a chain's tokens).
// Fetches the claim calldata on demand, then drives the existing claim saga. Only one claim
// runs at a time; the modal disables the other buttons while `isClaiming`.
export function useCollectLpRewards(): UseCollectLpRewardsResult {
  const account = useAccount()
  const dispatch = useDispatch()
  const selectChain = useSelectChain()
  const queryClient = useQueryClient()
  const markClaimed = useLpIncentivesClaimedStore((state) => state.markClaimed)
  const [activeKey, setActiveKey] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()

  const collect = useEvent(async ({ chainId, tokenAddresses }: CollectArgs): Promise<void> => {
    const walletAddress = account.address
    if (!walletAddress || activeKey) {
      return
    }
    setActiveKey(lpRewardsCollectKey(chainId, tokenAddresses))
    setError(undefined)

    try {
      const response = await queryClient.fetchQuery(
        liquidityQueries.claimRewards({
          params: new ClaimLPRewardsRequest({
            walletAddress,
            chainId,
            tokens: tokenAddresses,
            distributor: Distributor.MERKLE,
            simulateTransaction: true,
          }),
        }),
      )
      if (!response.claim) {
        throw new Error('Missing claim calldata')
      }

      dispatch(
        lpIncentivesClaimSaga.actions.trigger({
          address: walletAddress,
          claimData: response.claim,
          tokenAddresses,
          selectChain,
          walletChainId: account.chainId,
          // The saga reports per-step on-chain progress; the modal only needs `activeKey`, so the
          // step is dropped rather than parked in state nothing reads.
          setCurrentStep: noop,
          onSuccess: () => {
            markClaimed({ walletAddress, chainId, tokenAddresses, now: Date.now() })
            // Closes the Collect funnel for every multi-token surface: the click half is emitted by
            // each surface's Trace, and the UNI-only claim modal that used to emit this isn't on
            // this path.
            sendAnalyticsEvent(UniswapEventName.LpIncentiveCollectRewardsSuccess, {
              chain_id: chainId,
              token_addresses: tokenAddresses,
            })
            setActiveKey(undefined)
          },
          // oxlint-disable-next-line no-shadow
          onFailure: (error) => {
            if (!didUserReject(error)) {
              logger.error(error, { tags: { file: 'useCollectLpRewards', function: 'collect' } })
              setError(error.message)
            }
            setActiveKey(undefined)
          },
        }),
      )
    } catch (e) {
      logger.error(e, { tags: { file: 'useCollectLpRewards', function: 'collect' } })
      setError(e instanceof Error ? e.message : 'Failed to collect rewards')
      setActiveKey(undefined)
    }
  })

  const clearError = useEvent((): void => {
    setError(undefined)
  })

  return { collect, activeKey, isClaiming: activeKey !== undefined, error, clearError }
}
