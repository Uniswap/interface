import { InterfacePageName } from '@uniswap/analytics-events'
import { CHAIN_IDS_TO_NAMES, useIsSupportedChainIdCallback } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { useCallback } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useAppDispatch } from 'state/hooks'
import { endSwitchingChain, startSwitchingChain } from 'state/wallets/reducer'
import { trace } from 'tracing/trace'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { InterfaceChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'
import { useSwitchChain as useSwitchChainWagmi } from 'wagmi'

export function useSwitchChain() {
  const dispatch = useAppDispatch()
  const isSupportedChainCallback = useIsSupportedChainIdCallback()
  const multichainUXEnabled = useFeatureFlag(FeatureFlags.MultichainUX)
  const { switchChain } = useSwitchChainWagmi()
  const { connector } = useAccount()
  const [searchParams, setSearchParams] = useSearchParams()

  const { pathname } = useLocation()
  const page = getCurrentPageFromLocation(pathname)

  return useCallback(
    (chainId: InterfaceChainId) => {
      const isSupportedChain = isSupportedChainCallback(chainId)
      if (!isSupportedChain) {
        throw new Error(`Chain ${chainId} not supported for connector (${connector?.name})`)
      }
      return trace(
        { name: 'Switch chain', op: 'wallet.switch_chain' },
        () =>
          new Promise<void>((resolve, reject) => {
            dispatch(startSwitchingChain(chainId))
            switchChain(
              { chainId },
              {
                onSuccess() {
                  try {
                    if (multichainUXEnabled || page === InterfacePageName.EXPLORE_PAGE) {
                      return
                    }
                    searchParams.set('chain', CHAIN_IDS_TO_NAMES[chainId])
                    setSearchParams(searchParams, { replace: true })
                  } catch (error) {
                    logger.warn('useSwitchChain', 'useSwitchChain', 'Failed to set SearchParams', {
                      error,
                      searchParams,
                    })
                  }
                },
                onSettled(_, error) {
                  dispatch(endSwitchingChain())
                  if (error) {
                    reject(error)
                  } else {
                    resolve()
                  }
                },
              },
            )
          }),
      )
    },
    [
      isSupportedChainCallback,
      connector?.name,
      dispatch,
      switchChain,
      multichainUXEnabled,
      page,
      searchParams,
      setSearchParams,
    ],
  )
}
