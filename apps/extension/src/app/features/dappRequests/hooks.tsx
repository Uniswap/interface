import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { DappRequestStoreItem } from 'src/app/features/dappRequests/slice'
import {
  isRequestAccountRequest,
  isRequestPermissionsRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { getBridgingDappUrls } from 'uniswap/src/features/bridging/constants'
import { useBridgingSupportedChainIds, useNumBridgingChains } from 'uniswap/src/features/bridging/hooks/chains'
import { selectHasViewedDappRequestBridgingBanner } from 'wallet/src/features/behaviorHistory/selectors'
import { WalletState } from 'wallet/src/state/walletReducer'

export function useShouldShowBridgingRequestCard(
  request: DappRequestStoreItem | undefined,
  dappUrl: string,
): {
  numBridgingChains: number
  shouldShowBridgingRequestCard: boolean
} {
  const numBridgingChains = useNumBridgingChains()
  const bridgingChainIds = useBridgingSupportedChainIds()
  const bridgingDappUrls = useMemo(() => getBridgingDappUrls(bridgingChainIds), [bridgingChainIds])

  const hasViewedDappRequestBridgingBanner = useSelector((state: WalletState) =>
    selectHasViewedDappRequestBridgingBanner(state, dappUrl),
  )

  const isConnectRequest = useMemo(
    () =>
      (request && (isRequestAccountRequest(request.dappRequest) || isRequestPermissionsRequest(request.dappRequest))) ??
      false,
    [request],
  )

  const isBridgingConnectionRequest = useMemo(
    () => isConnectRequest && bridgingDappUrls.includes(dappUrl),
    [isConnectRequest, bridgingDappUrls, dappUrl],
  )

  return {
    numBridgingChains,
    shouldShowBridgingRequestCard: isBridgingConnectionRequest && !hasViewedDappRequestBridgingBanner,
  }
}
