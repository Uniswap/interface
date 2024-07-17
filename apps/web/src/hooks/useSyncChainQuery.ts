import { InterfacePageName } from '@uniswap/analytics-events'
import { CHAIN_IDS_TO_NAMES, useIsSupportedChainId } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useSelectChain from 'hooks/useSelectChain'
import { useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useSwapAndLimitContext } from 'state/swap/hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { usePrevious } from 'utilities/src/react/hooks'
import { getParsedChainId } from 'utils/chains'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

export default function useSyncChainQuery(chainIdRef: React.MutableRefObject<number | undefined>) {
  const account = useAccount()
  const prevConnectedChainId = usePrevious(account.chainId)
  const { chainId } = useSwapAndLimitContext()
  const isSupportedChain = useIsSupportedChainId(chainId)
  const parsedQs = useParsedQueryString()
  const multichainUXEnabled = useFeatureFlag(FeatureFlags.MultichainUX)

  const selectChain = useSelectChain()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlChainId = getParsedChainId(parsedQs)

  const { pathname } = useLocation()
  const page = getCurrentPageFromLocation(pathname)

  useEffect(() => {
    if (multichainUXEnabled || page === InterfacePageName.EXPLORE_PAGE) {
      return
    }

    // Set page/app chain to match query params
    if (urlChainId && account.chainId !== urlChainId) {
      chainIdRef.current = urlChainId
      selectChain(urlChainId)
    } else if (
      account.chainId !== (urlChainId ?? UniverseChainId.Mainnet) &&
      (searchParams.has('inputCurrency') || searchParams.has('outputCurrency'))
    ) {
      chainIdRef.current = urlChainId ?? UniverseChainId.Mainnet
      selectChain(urlChainId ?? UniverseChainId.Mainnet)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- exclude account.chainId & searchParams; don't want to trigger twice on account.chainId & urlChainId both being set
  }, [account.isConnected, chainIdRef, multichainUXEnabled, page, parsedQs, selectChain, urlChainId])

  useEffect(() => {
    if (chainIdRef.current || chainIdRef.current === account.chainId) {
      chainIdRef.current = undefined
      return
    }
    // If a user has a connected wallet and has manually changed their chain, update the query parameter if it's supported
    if (
      !multichainUXEnabled &&
      account.isConnected &&
      account.chainId &&
      account.chainId !== prevConnectedChainId &&
      account.chainId !== (urlChainId ?? UniverseChainId.Mainnet)
    ) {
      searchParams.delete('inputCurrency')
      searchParams.delete('outputCurrency')
      if (isSupportedChain) {
        searchParams.set('chain', CHAIN_IDS_TO_NAMES[account.chainId])
      } else if (searchParams.has('chain')) {
        searchParams.delete('chain')
      }
      setSearchParams(searchParams, { replace: true })
    }
  }, [
    account.chainId,
    account.isConnected,
    chainIdRef,
    isSupportedChain,
    multichainUXEnabled,
    prevConnectedChainId,
    searchParams,
    setSearchParams,
    urlChainId,
  ])
}
