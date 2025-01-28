import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Flex, Tooltip } from 'ui/src'
import { easeInEaseOutLayoutAnimation } from 'ui/src/animations/layout/layoutAnimation'
import { AlertTriangle } from 'ui/src/components/icons/AlertTriangle'
import { Ellipsis } from 'ui/src/components/icons/Ellipsis'
import { colors, iconSizes } from 'ui/src/theme'
import { AnimatedNetworkLogo } from 'uniswap/src/components/CurrencyLogo/AnimatedNetworkLogo'
import { NetworkLogo, SQUIRCLE_BORDER_RADIUS_RATIO } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UnichainTooltip } from 'uniswap/src/components/TokenSelector/tooltips/UnichainNetworkTooltip'
import {
  ActionSheetDropdown,
  ActionSheetDropdownStyleProps,
} from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { useNetworkOptions } from 'uniswap/src/components/network/hooks'
import { selectHasSeenUnichainPromotionNetworkSelectorTooltip } from 'uniswap/src/features/behaviorHistory/selectors'
import { setHasSeenNetworkSelectorTooltip } from 'uniswap/src/features/behaviorHistory/slice'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isInterface, isMobileApp, isMobileWeb } from 'utilities/src/platform'

const ELLIPSIS = 'ellipsis'
const NETWORK_ICON_SIZE = iconSizes.icon20
const NETWORK_ICON_SHIFT = 8

interface NetworkFilterProps {
  chainIds: UniverseChainId[]
  selectedChain: UniverseChainId | null
  onPressChain: (chainId: UniverseChainId | null) => void
  onDismiss?: () => void
  includeAllNetworks?: boolean
  showUnsupportedConnectedChainWarning?: boolean
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
  ] as Array<UniverseChainId | typeof ELLIPSIS>

  const renderItem = useCallback(
    ({ item: chainId }: { item: ListItem }) => (
      <Flex key={chainId} borderColor="$surface2" borderRadius={8} borderWidth={2} ml={-NETWORK_ICON_SHIFT}>
        {chainId === ELLIPSIS ? (
          <Flex
            centered
            backgroundColor="$neutral3"
            borderRadius={networkIconSize * SQUIRCLE_BORDER_RADIUS_RATIO}
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
  chainIds,
  selectedChain,
  onPressChain,
  onDismiss,
  includeAllNetworks,
  showUnsupportedConnectedChainWarning,
  styles,
  hideArrow = false,
}: NetworkFilterProps): JSX.Element {
  const { defaultChainId } = useEnabledChains()
  const dispatch = useDispatch()
  const unichainPromotionEnabled = useFeatureFlag(FeatureFlags.UnichainPromo)
  const unichainEnabled = useFeatureFlag(FeatureFlags.Unichain)
  const hasSeenUnichainPromotionNetworkSelectorTooltip = useSelector(
    selectHasSeenUnichainPromotionNetworkSelectorTooltip,
  )
  const showUnichainPromo =
    unichainEnabled && unichainPromotionEnabled && !hasSeenUnichainPromotionNetworkSelectorTooltip
  // Desktop Web exclusive
  const showUnichainPromoTooltip = isInterface && !isMobileWeb && showUnichainPromo
  // Wallet and MWeb exclusive
  const showUnichainPromoAnimation = (!isInterface || isMobileWeb) && showUnichainPromo

  const onPress = useCallback(
    async (chainId: UniverseChainId | null) => {
      // Ensures smooth animation on mobile
      if (isMobileApp) {
        easeInEaseOutLayoutAnimation()
      }

      onPressChain(chainId)

      if (showUnichainPromo) {
        dispatch(setHasSeenNetworkSelectorTooltip(true))
      }
    },
    [dispatch, onPressChain, showUnichainPromo],
  )

  const wrappedOnDismiss = useCallback(() => {
    if (showUnichainPromo) {
      dispatch(setHasSeenNetworkSelectorTooltip(true))
    }
    onDismiss?.()
  }, [dispatch, onDismiss, showUnichainPromo])

  const networkOptions = useNetworkOptions({
    selectedChain,
    onPress,
    includeAllNetworks,
    chainIds,
  })

  return (
    <Tooltip placement="right" open={showUnichainPromoTooltip}>
      <Tooltip.Trigger>
        <ActionSheetDropdown
          options={networkOptions}
          showArrow={!hideArrow}
          styles={{
            alignment: 'right',
            buttonPaddingY: '$none',
            ...styles,
          }}
          testID="chain-selector"
          onDismiss={wrappedOnDismiss}
        >
          {showUnsupportedConnectedChainWarning ? (
            <AlertTriangle color="$neutral2" size={20} />
          ) : showUnichainPromoAnimation ? (
            <AnimatedNetworkLogo
              promoChainId={UniverseChainId.Unichain}
              size={NETWORK_ICON_SIZE}
              selectedChain={selectedChain ?? (includeAllNetworks ? null : defaultChainId)}
              includeAllNetworks={includeAllNetworks}
            />
          ) : (
            <NetworkLogo
              chainId={selectedChain ?? (includeAllNetworks ? null : defaultChainId)}
              size={NETWORK_ICON_SIZE}
            />
          )}
        </ActionSheetDropdown>
      </Tooltip.Trigger>
      <UnichainTooltip onPress={() => onPress(UniverseChainId.Unichain)} />
    </Tooltip>
  )
}
