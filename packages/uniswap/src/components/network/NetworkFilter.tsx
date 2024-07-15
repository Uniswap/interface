import { useCallback, useMemo, useState } from 'react'
import { Flex, HapticFeedback } from 'ui/src'
import { Ellipsis } from 'ui/src/components/icons/Ellipsis'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { colors, iconSizes } from 'ui/src/theme'
import {
  SQUARE_BORDER_RADIUS as NETWORK_LOGO_SQUARE_BORDER_RADIUS,
  NetworkLogo,
} from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { useNetworkOptions } from 'uniswap/src/components/network/hooks'
import { UniverseChainId, WALLET_SUPPORTED_CHAIN_IDS, WalletChainId } from 'uniswap/src/types/chains'

const ELLIPSIS = 'ellipsis'
const NETWORK_ICON_SIZE = iconSizes.icon20
const NETWORK_ICON_SHIFT = 8
// Array of logos to show when "all networks" are visible. Don't want to show all
// logos because there are too many
const NETWORK_LOGOS_TO_SHOW: WalletChainId[] = [
  UniverseChainId.Mainnet,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Optimism,
  UniverseChainId.Base,
]

interface NetworkFilterProps {
  selectedChain: UniverseChainId | null
  onPressChain: (chainId: UniverseChainId | null) => void
  onPressAnimation?: () => void
  onDismiss?: () => void
  includeAllNetworks?: boolean
  showEllipsisInitially?: boolean
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
  showEllipsisInitially,
}: NetworkFilterProps): JSX.Element {
  // TODO: remove the comment below once we add it to the main swap screen
  // we would need this later, when we add it to the main swap screen
  const [showEllipsisIcon, setShowEllipsisIcon] = useState(showEllipsisInitially ?? false)

  const onPress = useCallback(
    async (chainId: UniverseChainId | null) => {
      onPressAnimation?.()
      await HapticFeedback.selection()
      if (showEllipsisIcon && chainId !== selectedChain) {
        setShowEllipsisIcon(false)
      }
      onPressChain(chainId)
    },
    [showEllipsisIcon, selectedChain, onPressChain, onPressAnimation],
  )

  const networkOptions = useNetworkOptions({
    selectedChain,
    onPress,
    includeAllNetworks,
    chainIds: WALLET_SUPPORTED_CHAIN_IDS,
  })

  const networks = useMemo(() => {
    return selectedChain ? [selectedChain] : NETWORK_LOGOS_TO_SHOW
  }, [selectedChain])

  return (
    <ActionSheetDropdown alignment="right" options={networkOptions} testID="chain-selector" onDismiss={onDismiss}>
      <Flex centered row gap="$spacing4">
        <NetworksInSeries
          // show ellipsis as the last item when all networks is selected
          ellipsisPosition={!selectedChain ? 'end' : undefined}
          // show specific network or all
          networks={networks}
        />
        <RotatableChevron color="$neutral3" direction="down" height={iconSizes.icon20} width={iconSizes.icon20} />
      </Flex>
    </ActionSheetDropdown>
  )
}
