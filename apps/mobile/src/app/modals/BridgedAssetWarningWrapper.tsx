import { AppStackScreenProp } from 'src/app/navigation/types'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { BridgedAssetModal } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useDismissedBridgedAssetWarnings } from 'uniswap/src/features/tokens/slice/hooks'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

export function BridgedAssetWarningWrapper({
  route,
}: AppStackScreenProp<typeof ModalName.BridgedAssetNav>): JSX.Element | null {
  const { defaultChainId } = useEnabledChains()
  const { onClose } = useReactNavigationModal()

  const { currencyId, onAcknowledge } = route.params.initialState ?? {}
  const currencyChainId = (currencyId && currencyIdToChain(currencyId)) || defaultChainId
  const currencyAddress = currencyId ? currencyIdToAddress(currencyId) : undefined
  const currencyInfo = useCurrencyInfo(currencyId)

  // Get the token info only if we have a valid non-native currency
  const isNativeCurrency = isNativeCurrencyAddress(currencyChainId, currencyAddress)
  const { tokenWarningDismissed: bridgedAssetWarningDismissed } = useDismissedBridgedAssetWarnings(
    isNativeCurrency || !currencyAddress ? undefined : { chainId: currencyChainId, address: currencyAddress },
  )

  // Return null if modal state is malformed
  if (!route.params.initialState) {
    return null
  }

  // If no currency info found, skip warning and proceed to SwapFlow
  if (!currencyInfo) {
    onAcknowledge?.()
    return null
  }

  const isBridgedAsset = Boolean(currencyInfo.isBridged)

  // If token is not bridged or warning was dismissed and not blocked, skip warning and proceed to SwapFlow
  if (!isBridgedAsset || bridgedAssetWarningDismissed) {
    onAcknowledge?.()
    return null
  }

  return (
    <BridgedAssetModal
      currencyInfo0={currencyInfo}
      isOpen={true}
      modalName={ModalName.BridgedAssetNav}
      onClose={onClose}
      onContinue={onAcknowledge}
    />
  )
}
