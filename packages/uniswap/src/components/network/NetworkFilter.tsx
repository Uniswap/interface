import { useCallback } from 'react'
import { easeInEaseOutLayoutAnimation } from 'ui/src/animations/layout/layoutAnimation'
import { AlertTriangle } from 'ui/src/components/icons/AlertTriangle'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import {
  ActionSheetDropdown,
  ActionSheetDropdownStyleProps,
} from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { useNetworkOptions } from 'uniswap/src/components/network/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isMobileApp } from 'utilities/src/platform'

const NETWORK_ICON_SIZE = iconSizes.icon20

export interface NetworkFilterProps {
  chainIds: UniverseChainId[]
  selectedChain: UniverseChainId | null
  onPressChain: (chainId: UniverseChainId | null) => void
  includeAllNetworks?: boolean
  showUnsupportedConnectedChainWarning?: boolean
  styles?: ActionSheetDropdownStyleProps
  hideArrow?: boolean
}

export function NetworkFilter({
  chainIds,
  selectedChain,
  onPressChain,
  includeAllNetworks,
  showUnsupportedConnectedChainWarning,
  styles,
  hideArrow = false,
}: NetworkFilterProps): JSX.Element {
  const { defaultChainId } = useEnabledChains()

  const onPress = useCallback(
    async (chainId: UniverseChainId | null) => {
      // Ensures smooth animation on mobile
      if (isMobileApp) {
        easeInEaseOutLayoutAnimation()
      }

      onPressChain(chainId)
    },
    [onPressChain],
  )

  const networkOptions = useNetworkOptions({
    selectedChain,
    onPress,
    includeAllNetworks,
    chainIds,
  })

  return (
    <ActionSheetDropdown
      options={networkOptions}
      showArrow={!hideArrow}
      styles={{
        alignment: 'right',
        buttonPaddingY: '$none',
        ...styles,
      }}
      testID="chain-selector"
    >
      {showUnsupportedConnectedChainWarning ? (
        <AlertTriangle color="$neutral2" size={20} />
      ) : (
        <NetworkLogo chainId={selectedChain ?? (includeAllNetworks ? null : defaultChainId)} size={NETWORK_ICON_SIZE} />
      )}
    </ActionSheetDropdown>
  )
}
