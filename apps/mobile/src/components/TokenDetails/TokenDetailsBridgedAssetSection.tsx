import { navigate } from 'src/app/navigation/rootNavigation'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { BridgedAssetTDPSection } from 'uniswap/src/components/BridgedAsset/BridgedAssetTDPSection'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'

export function TokenDetailsBridgedAssetSection(): JSX.Element | null {
  const { currencyId, chainId, address } = useTokenDetailsContext()
  const currencyInfo = useCurrencyInfo(currencyId)
  const { navigateToSwapFlow } = useWalletNavigation()
  const handlePress = useEvent(() => {
    if (!currencyInfo) {
      return
    }
    navigate(ModalName.BridgedAsset, {
      currencyInfo0: currencyInfo,
      onContinue: () => {
        navigateToSwapFlow({
          currencyField: CurrencyField.OUTPUT,
          currencyAddress: address,
          currencyChainId: chainId,
          origin: ModalName.BridgedAsset,
        })
      },
    })
  })
  const isBridgedAsset = Boolean(currencyInfo?.isBridged)
  if (!isBridgedAsset || !currencyInfo) {
    return null
  }

  return <BridgedAssetTDPSection currencyInfo={currencyInfo} onPress={handlePress} />
}
