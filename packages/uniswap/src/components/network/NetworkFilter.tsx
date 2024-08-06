import { useCallback } from 'react'
import { Flex, HapticFeedback } from 'ui/src'
import { Ellipsis } from 'ui/src/components/icons/Ellipsis'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { colors, iconSizes } from 'ui/src/theme'
import {
  SQUARE_BORDER_RADIUS as NETWORK_LOGO_SQUARE_BORDER_RADIUS,
  NetworkLogo,
} from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import {
  ActionSheetDropdown,
  ActionSheetDropdownStyleProps,
} from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { useNetworkOptions } from 'uniswap/src/components/network/hooks'
import { UniverseChainId, WALLET_SUPPORTED_CHAIN_IDS, WalletChainId } from 'uniswap/src/types/chains'

const ELLIPSIS = 'ellipsis'
const NETWORK_ICON_SIZE = iconSizes.icon20
const NETWORK_ICON_SHIFT = 8

interface NetworkFilterProps {
  selectedChain: UniverseChainId | null
  onPressChain: (chainId: UniverseChainId | null) => void
  onPressAnimation?: () => void
  onDismiss?: () => void
  includeAllNetworks?: boolean
  styles?: ActionSheetDropdownStyleProps
  hideArrow?: boolean
}

type EllipsisPosition = 'start' | 'end'

type ListItem = 'ellipsis' | number

export function NetworksInSeries({
  networks,
  ellipsisPosition,
  networkIconSize = NETWORK_ICON_SIZE,
}: {
  networks: UniverseChainId[]
  ellipsisPosition?: EllipsisPosition
  networkIconSize?: number
}): JSX.Element {
  const items = [
    ...(ellipsisPosition === 'start' ? [ELLIPSIS] : []),
    ...networks,
    ...(ellipsisPosition === 'end' ? [ELLIPSIS] : []),
  ] as Array<WalletChainId | typeof ELLIPSIS>

  const renderItem = useCallback(
    ({ item: chainId }: { item: ListItem }) => (
      <Flex key={chainId} borderColor="$surface2" borderRadius={8} borderWidth={2} ml={-NETWORK_ICON_SHIFT}>
        {chainId === ELLIPSIS ? (
          <Flex
            centered
            backgroundColor="$neutral3"
            borderRadius={NETWORK_LOGO_SQUARE_BORDER_RADIUS}
            height={networkIconSize}
            width={networkIconSize}
          >
            <Ellipsis color={colors.white} size={iconSizes.icon12} />
          </Flex>
        ) : (
          <NetworkLogo chainId={chainId} shape="square" size={networkIconSize} />
        )}
      </Flex>
    ),
    [networkIconSize],
  )

  return (
    <Flex row pl={NETWORK_ICON_SHIFT}>
      {items.map((chainId) => renderItem({ item: chainId }))}
    </Flex>
  )
}

export function NetworkFilter({
  selectedChain,
  onPressChain,
  onPressAnimation,
  onDismiss,
  includeAllNetworks,
  styles,
  hideArrow = false,
}: NetworkFilterProps): JSX.Element {
  const onPress = useCallback(
    async (chainId: UniverseChainId | null) => {
      onPressAnimation?.()
      await HapticFeedback.selection()
      onPressChain(chainId)
    },
    [onPressChain, onPressAnimation],
  )

  const networkOptions = useNetworkOptions({
    selectedChain,
    onPress,
    includeAllNetworks,
    chainIds: WALLET_SUPPORTED_CHAIN_IDS,
  })

  return (
    <ActionSheetDropdown
      options={networkOptions}
      styles={{
        alignment: 'right',
        ...styles,
      }}
      testID="chain-selector"
      onDismiss={onDismiss}
    >
      <Flex centered row gap="$spacing8">
        <NetworkLogo chainId={selectedChain ?? null} size={NETWORK_ICON_SIZE} />
        <RotatableChevron
          color="$neutral3"
          direction="down"
          display={hideArrow ? 'none' : 'block'}
          height={iconSizes.icon20}
          width={iconSizes.icon20}
        />
      </Flex>
    </ActionSheetDropdown>
  )
}
