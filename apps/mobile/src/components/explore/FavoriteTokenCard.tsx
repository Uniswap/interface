import { useIsFocused } from '@react-navigation/core'
import { isIOS } from '@universe/environment'
import { AnimatedTouchableArea, borderRadii, Flex, imageSizes, Text } from '@universe/mycelium'
import { useIsDarkMode, useShadowPropsShort } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import React, { memo, useMemo } from 'react'
import type { StyleProp, ViewProps, ViewStyle } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useDispatch } from 'react-redux'
import { useExploreTokenContextMenu } from 'src/components/explore/hooks'
import RemoveButton from 'src/components/explore/RemoveButton'
import { Loader } from 'src/components/loading/loaders'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
// fonts stays on ui/src: its values are device-adaptive (adjustedSize) while mycelium's are
// static, and the loaders below must size to the exact rendered $heading3/$subheading2 text.
import { fonts } from 'ui/src/theme'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useContextMenuPressGate } from 'uniswap/src/components/menus/hooks/useContextMenuPressGate'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useTokenPriceChange, useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { removeFavoriteToken } from 'uniswap/src/features/favorites/slice'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'

const ESTIMATED_FAVORITE_TOKEN_CARD_LOADER_HEIGHT = 116

const contextMenuStyle: StyleProp<ViewStyle> = {
  borderRadius: borderRadii.rounded16,
}

export type FavoriteTokenCardProps = {
  currencyId: string
  isEditing?: boolean
  networkCount?: number
  setIsEditing: (update: boolean) => void
  showLoading?: boolean
} & ViewProps

function FavoriteTokenCard({
  currencyId,
  isEditing,
  networkCount,
  setIsEditing,
  showLoading,
  ...rest
}: FavoriteTokenCardProps): JSX.Element {
  const dispatch = useDispatch()
  const isDarkMode = useIsDarkMode()
  const isFocused = useIsFocused()

  const { defaultChainId } = useEnabledChains()
  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const { data: token, isLoading: tokenLoading } = useCurrencyInfoWithLoading(currencyId)
  const refetchInterval = useMemo(() => (isFocused ? PollingInterval.KindaFast : undefined), [isFocused])
  const price = useTokenSpotPrice(currencyId, { refetchInterval })
  const pricePercentChange = useTokenPriceChange(currencyId, { refetchInterval })

  const chainId = currencyIdToChain(currencyId) ?? defaultChainId

  const priceFormatted = useMemo(
    () => convertFiatAmountFormatted(price, NumberType.FiatTokenPrice),
    [convertFiatAmountFormatted, price],
  )

  const onRemove = useEvent(() => {
    if (currencyId) {
      dispatch(removeFavoriteToken({ currencyId }))
    }
  })

  const onEditFavorites = useEvent(() => {
    setIsEditing(true)
  })

  const { menuActions, onContextMenuPress } = useExploreTokenContextMenu({
    chainId,
    currencyId,
    analyticsSection: SectionName.ExploreFavoriteTokensSection,
    onEditFavorites,
    tokenName: token?.currency.name,
  })

  const onPress = useEvent(() => {
    if (isEditing || !currencyId) {
      return
    }
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigate(currencyId)
  })

  const { onPressIn, onPressOut, handlePress } = useContextMenuPressGate({ onPress })

  const shadowProps = useShadowPropsShort()

  const symbol = token?.currency.symbol
  const symbolDisplayText = useMemo(() => getSymbolDisplayText(symbol), [symbol])

  if (showLoading) {
    return (
      <Loader.Favorite
        contrast
        borderWidth="$spacing1"
        borderColor="transparent"
        height={ESTIMATED_FAVORITE_TOKEN_CARD_LOADER_HEIGHT}
      />
    )
  }

  const card = (
    <AnimatedTouchableArea
      activeOpacity={isEditing ? 1 : undefined}
      borderRadius="$rounded16"
      overflow={isIOS ? 'hidden' : 'visible'}
      testID={`${TestID.FavoriteTokenCardPrefix}${symbol}`}
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...shadowProps}
    >
      <Flex
        alignItems="flex-start"
        gap="$spacing8"
        p="$spacing12"
        backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
        borderColor={isDarkMode ? '$transparent' : '$surface3'}
        borderWidth="$spacing1"
        borderRadius="$rounded16"
      >
        <Flex row gap="$spacing4" justifyContent="space-between">
          <Flex grow row alignItems="center" gap="$spacing8">
            <TokenLogo
              loading={tokenLoading}
              chainId={chainId}
              hideNetworkLogo={(networkCount ?? 0) > 1}
              name={token?.currency.name}
              size={imageSizes.image20}
              symbol={symbol}
              url={token?.logoUrl ?? undefined}
            />
            <Text variant="body1">{symbolDisplayText}</Text>
          </Flex>
          <RemoveButton visible={isEditing} onPress={onRemove} />
        </Flex>
        <Flex gap="$spacing2">
          {price !== undefined ? (
            <AnimatedNumber numericValue={price} value={priceFormatted} textVariant="$heading3" />
          ) : (
            <Loader.Box
              height={fonts.heading3.lineHeight}
              width={fonts.heading3.lineHeight * 3}
              testID="loader/favorite/price"
            />
          )}
          {pricePercentChange !== undefined ? (
            <RelativeChange
              shouldAnimate
              arrowSize="$icon.16"
              change={pricePercentChange}
              semanticColor={true}
              variant="subheading2"
            />
          ) : (
            <Loader.Box
              height={fonts.subheading2.lineHeight}
              width={fonts.subheading2.lineHeight * 3}
              testID="loader/favorite/priceChange"
            />
          )}
        </Flex>
      </Flex>
    </AnimatedTouchableArea>
  )

  // Unmount ContextMenu while editing — a disabled native context menu can still interrupt
  // Sortable's Manual gesture on New Architecture and leave per-item drag state stuck.
  if (isEditing) {
    return card
  }

  return (
    <ContextMenu actions={menuActions} style={contextMenuStyle} onPress={onContextMenuPress} {...rest}>
      {card}
    </ContextMenu>
  )
}

export default memo(FavoriteTokenCard)
