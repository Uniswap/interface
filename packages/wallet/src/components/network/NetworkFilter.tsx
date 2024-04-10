import { selectionAsync } from 'expo-haptics'
import { useCallback, useMemo, useState } from 'react'
import { LayoutAnimation, StyleSheet, VirtualizedList } from 'react-native'
import { Flex, Icons, isWeb } from 'ui/src'
import EllipsisIcon from 'ui/src/assets/icons/ellipsis.svg'
import { colors, iconSizes } from 'ui/src/theme'
import {
  SQUARE_BORDER_RADIUS as NETWORK_LOGO_SQUARE_BORDER_RADIUS,
  NetworkLogo,
} from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { ActionSheetDropdown } from 'wallet/src/components/dropdowns/ActionSheetDropdown'
import { useNetworkOptions } from 'wallet/src/components/network/hooks'
import { ChainId } from 'wallet/src/constants/chains'

const ELLIPSIS = 'ellipsis'
const NETWORK_ICON_SIZE = iconSizes.icon20
const NETWORK_ICON_SHIFT = 10
// Array of logos to show when "all networks" are visible. Don't want to show all
// logos because there are too many
const NETWORK_LOGOS_TO_SHOW = [
  ChainId.Mainnet,
  ChainId.Polygon,
  ChainId.ArbitrumOne,
  ChainId.Optimism,
]

interface NetworkFilterProps {
  selectedChain: ChainId | null
  onPressChain: (chainId: ChainId | null) => void
  includeAllNetworks?: boolean
  showEllipsisInitially?: boolean
}

type EllipsisPosition = 'start' | 'end'

type ListItem = 'ellipsis' | number

function renderItem({ item: chainId }: { item: ListItem }): JSX.Element {
  return (
    <Flex key={chainId} borderColor="$surface2" style={styles.networksInSeriesIcon}>
      {chainId === ELLIPSIS ? (
        <Flex
          centered
          backgroundColor="$neutral3"
          height={NETWORK_ICON_SIZE}
          style={styles.ellipsisIcon}
          width={NETWORK_ICON_SIZE}>
          <EllipsisIcon color={colors.white} height={iconSizes.icon12} width={iconSizes.icon12} />
        </Flex>
      ) : (
        <NetworkLogo chainId={chainId} shape="square" size={NETWORK_ICON_SIZE} />
      )}
    </Flex>
  )
}
function keyExtractor(item: ListItem): string {
  return item.toString()
}

function NetworksInSeries({
  networks,
  ellipsisPosition,
}: {
  networks: ChainId[]
  ellipsisPosition?: EllipsisPosition
}): JSX.Element {
  const items = [
    ...(ellipsisPosition === 'start' ? [ELLIPSIS] : []),
    ...networks,
    ...(ellipsisPosition === 'end' ? [ELLIPSIS] : []),
  ] as Array<ChainId | typeof ELLIPSIS>

  const getItem = (_data: unknown, index: number): ListItem => {
    // items[index] must exists here as index is bounded by getItemCount
    return items[index] as ListItem
  }

  const getItemCount = (): number => {
    return items.length
  }

  return (
    <Flex>
      <VirtualizedList<ListItem>
        contentContainerStyle={styles.networkListContainer}
        getItem={getItem}
        getItemCount={getItemCount}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </Flex>
  )
}

export function NetworkFilter({
  selectedChain,
  onPressChain,
  includeAllNetworks,
  showEllipsisInitially,
}: NetworkFilterProps): JSX.Element {
  // TODO: remove the comment below once we add it to the main swap screen
  // we would need this later, when we add it to the main swap screen
  const [showEllipsisIcon, setShowEllipsisIcon] = useState(showEllipsisInitially ?? false)

  const onPress = useCallback(
    async (chainId: ChainId | null) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      if (!isWeb) {
        await selectionAsync()
      }
      if (showEllipsisIcon && chainId !== selectedChain) {
        setShowEllipsisIcon(false)
      }
      onPressChain(chainId)
    },
    [showEllipsisIcon, selectedChain, onPressChain]
  )

  const networkOptions = useNetworkOptions({ selectedChain, onPress, includeAllNetworks })

  const networks = useMemo(() => {
    return selectedChain ? [selectedChain] : NETWORK_LOGOS_TO_SHOW
  }, [selectedChain])

  return (
    <ActionSheetDropdown alignment="right" options={networkOptions}>
      <Flex centered row gap="$spacing4" py="$spacing8">
        <NetworksInSeries
          // show ellipsis as the last item when all networks is selected
          ellipsisPosition={!selectedChain ? 'end' : undefined}
          // show specific network or all
          networks={networks}
        />
        <Icons.RotatableChevron
          color="$neutral3"
          direction="down"
          height={iconSizes.icon20}
          width={iconSizes.icon20}
        />
      </Flex>
    </ActionSheetDropdown>
  )
}

const styles = StyleSheet.create({
  ellipsisIcon: {
    borderRadius: NETWORK_LOGO_SQUARE_BORDER_RADIUS,
  },
  networkListContainer: {
    flexDirection: 'row',
    paddingLeft: NETWORK_ICON_SHIFT,
  },
  networksInSeriesIcon: {
    borderRadius: 8,
    borderWidth: 2,
    marginLeft: -NETWORK_ICON_SHIFT,
  },
})
