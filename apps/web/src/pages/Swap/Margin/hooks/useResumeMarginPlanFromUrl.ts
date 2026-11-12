import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { selectPlanTransaction } from 'uniswap/src/features/transactions/selectors'
import { useConnectorClient } from 'wagmi'
import { useAccount } from '~/connection/hooks/useAccount'
import { useSelectChain } from '~/connection/hooks/useSelectChain'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { useAppSelector } from '~/state/hooks'
import { useStateRehydrated } from '~/state/useStateRehydrated'

export const MARGIN_RESUME_PLAN_PARAM = 'resumePlan'

/**
 * Resumes the plan named by `?resumePlan=` (set by Activity's Continue) and drops the param so a refresh doesn't re-run it.
 * Only a plan already in the connected wallet's local activity resumes; a link to any other plan is dropped.
 */
export function useResumeMarginPlanFromUrl(resumePlan: (params: { planId: string }) => Promise<void>): void {
  const [searchParams, setSearchParams] = useSearchParams()
  const planId = searchParams.get(MARGIN_RESUME_PLAN_PARAM)
  const account = useAccount()
  const { isConnected } = account
  const address = account.address
  const rehydrated = useStateRehydrated()
  const isInLocalActivity = useAppSelector(
    (state) =>
      !!planId &&
      !!address &&
      selectPlanTransaction(state, { address, chainId: MARGIN_CHAIN_ID, planId }) !== undefined,
  )
  const selectChain = useSelectChain()
  // The executor bails with "Wallet not connected" without a margin-chain wallet client, which a wallet
  // on another chain doesn't have — so switch first and keep the param until the client is there.
  // The client query errors off-chain and its key ignores the wallet's chain, so refetch it once switched.
  const { data: marginChainClient, refetch: refetchMarginChainClient } = useConnectorClient({
    chainId: MARGIN_CHAIN_ID,
  })
  const isWalletOnMarginChain = marginChainClient !== undefined

  useEffect(() => {
    if (!planId || !rehydrated || !address) {
      return
    }
    const dropParam = (): void =>
      setSearchParams(
        (params) => {
          params.delete(MARGIN_RESUME_PLAN_PARAM)
          return params
        },
        { replace: true },
      )
    if (!isInLocalActivity) {
      dropParam()
      return
    }
    if (!isWalletOnMarginChain) {
      if (isConnected) {
        void selectChain(MARGIN_CHAIN_ID).then(async (switched) => {
          if (switched) {
            await refetchMarginChainClient()
          }
        })
      }
      return
    }
    dropParam()
    void resumePlan({ planId })
  }, [
    planId,
    rehydrated,
    address,
    isInLocalActivity,
    isConnected,
    isWalletOnMarginChain,
    refetchMarginChainClient,
    resumePlan,
    selectChain,
    setSearchParams,
  ])
}
