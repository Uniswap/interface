import { useTheme } from '@react-navigation/core'
import { memo, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewStyle } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useFlatListAutoScroll } from 'src/components/explore/hooks/useFlatListAutoScroll'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NetworkPill } from 'uniswap/src/components/network/NetworkPill'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'

const keyExtractor = (chainId: UniverseChainId): string => chainId.toString()

const AllNetworksPill = memo(function AllNetworksPill({
  onPress,
  selected,
}: {
  onPress: () => void
  selected: boolean
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex
      centered
      row
      ml="$spacing8"
      backgroundColor={selected ? '$surface3' : '$surface1'}
      borderColor="$surface3"
      borderRadius="$rounded12"
      borderWidth="$spacing1"
      gap="$spacing8"
      pl="$spacing4"
      pr="$spacing12"
      py="$spacing4"
      testID={`${TestID.ExploreFilterChainPrefix}all`}
      onPress={onPress}
    >
      <NetworkLogo chainId={null} size={iconSizes.icon24} />
      <Text variant="buttonLabel3">{t('common.all')}</Text>
    </Flex>
  )
})

const contentContainerStyle: ViewStyle = {
  alignItems: 'center',
  gap: spacing.spacing8,
  paddingHorizontal: spacing.spacing8,
}

const NetworkPillsRow = memo(function NetworkPillsRow({
  selectedNetwork,
  onSelectNetwork,
}: {
  selectedNetwork: UniverseChainId | null
  onSelectNetwork: (chainId: UniverseChainId | null) => void
}): JSX.Element {
  const colors = useSporeColors()
  const theme = useTheme()
  const { chains } = useEnabledChains()
  const flatListRef = useRef<FlatList<UniverseChainId>>(null)

  // Auto-scroll to selected network when it changes
  useFlatListAutoScroll({
    flatListRef,
    selectedItem: selectedNetwork,
    items: chains,
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: need theme dep for foregroundColor to change on theme change
  const renderItemNetworkPills = useCallback(
    ({ item }: { item: UniverseChainId }) => {
      return (
        <TouchableArea onPress={() => onSelectNetwork(item)}>
          <NetworkPill
            showIcon
            backgroundColor={selectedNetwork === item ? '$surface3' : '$surface1'}
            borderColor="$surface3"
            borderRadius="$rounded12"
            chainId={item}
            foregroundColor={colors.neutral1.val}
            iconSize={iconSizes.icon24}
            pl="$spacing4"
            pr="$spacing12"
            py="$spacing4"
            showBackgroundColor={false}
            testID={`${TestID.ExploreFilterChainPrefix}${item}`}
            textVariant="buttonLabel3"
          />
        </TouchableArea>
      )
    },
    [colors.neutral1.val, onSelectNetwork, selectedNetwork, theme],
  )

  const ListHeaderComponent = useMemo(() => {
    return <AllNetworksPill selected={selectedNetwork === null} onPress={() => onSelectNetwork(null)} />
  }, [selectedNetwork, onSelectNetwork])

  const handleScrollToIndexFailed = useEvent(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      // Fallback to scroll to offset if scrollToIndex fails
      const offset = info.averageItemLength * info.index
      flatListRef.current?.scrollToOffset({ offset, animated: true })
    },
  )

  return (
    <Flex py="$spacing8">
      <FlatList
        ref={flatListRef}
        horizontal
        ListHeaderComponent={ListHeaderComponent}
        data={chains}
        keyExtractor={keyExtractor}
        contentContainerStyle={contentContainerStyle}
        renderItem={renderItemNetworkPills}
        showsHorizontalScrollIndicator={false}
        onScrollToIndexFailed={handleScrollToIndexFailed}
      />
    </Flex>
  )
})

export type NetworkPillsProps = {
  selectedNetwork: UniverseChainId | null
  onSelectNetwork: (chainId: UniverseChainId | null) => void
}

export const NetworkPills = memo(function NetworkPills({
  selectedNetwork,
  onSelectNetwork,
}: NetworkPillsProps): JSX.Element {
  const handleOnSelectNetwork = useCallback(
    (network: UniverseChainId | null) => {
      setImmediate(() => onSelectNetwork(network))
    },
    [onSelectNetwork],
  )

  return <NetworkPillsRow selectedNetwork={selectedNetwork} onSelectNetwork={handleOnSelectNetwork} />
})
