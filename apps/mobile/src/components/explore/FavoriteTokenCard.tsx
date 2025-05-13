import React, { memo, useCallback } from 'react'
import { ViewProps } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useDispatch } from 'react-redux'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import RemoveButton from 'src/components/explore/RemoveButton'
import { useExploreTokenContextMenu } from 'src/components/explore/hooks'
import { Loader } from 'src/components/loading/loaders'
import { disableOnPress } from 'src/utils/disableOnPress'
import { usePollOnFocusOnly } from 'src/utils/hooks'
import { AnimatedTouchableArea, Flex, Text, useIsDarkMode, useShadowPropsShort, useSporeColors } from 'ui/src'
import { borderRadii, fonts, imageSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  FavoriteTokenCardQuery,
  useFavoriteTokenCardQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils'
import { removeFavoriteToken } from 'uniswap/src/features/favorites/slice'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { isIOS } from 'utilities/src/platform'
import { isNonPollingRequestInFlight } from 'wallet/src/data/utils'

const ESTIMATED_FAVORITE_TOKEN_CARD_LOADER_HEIGHT = 116

export type FavoriteTokenCardProps = {
  currencyId: string
  isEditing?: boolean
  setIsEditing: (update: boolean) => void
  showLoading?: boolean
} & ViewProps

function FavoriteTokenCard({
  currencyId,
  isEditing,
  setIsEditing,
  showLoading,
  ...rest
}: FavoriteTokenCardProps): JSX.Element {
  const dispatch = useDispatch()
  const { defaultChainId } = useEnabledChains()
  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()

  const { data, loading, networkStatus, startPolling, stopPolling } = useFavoriteTokenCardQuery({
    variables: currencyIdToContractInput(currencyId),
    // Rely on cache for fast favoriting UX, and poll for updates.
    fetchPolicy: 'cache-and-network',
    returnPartialData: true,
  })

  usePollOnFocusOnly(startPolling, stopPolling, PollingInterval.Fast)

  const token = data?.token

  // Mirror behavior in top tokens list, use first chain the token is on for the symbol
  const chainId = fromGraphQLChain(token?.chain) ?? defaultChainId

  // Coingecko price is more accurate but lacks long tail tokens
  // Uniswap price comes from Uniswap pools, which may be updated less frequently
  const { price, pricePercentChange } = getCoingeckoPrice(token) ?? getUniswapPrice(token)
  const priceFormatted = convertFiatAmountFormatted(price, NumberType.FiatTokenPrice)

  const onRemove = useCallback(() => {
    if (currencyId) {
      dispatch(removeFavoriteToken({ currencyId }))
    }
  }, [currencyId, dispatch])

  const onEditFavorites = useCallback(() => {
    setIsEditing(true)
  }, [setIsEditing])

  const { menuActions, onContextMenuPress } = useExploreTokenContextMenu({
    chainId,
    currencyId,
    analyticsSection: SectionName.ExploreFavoriteTokensSection,
    onEditFavorites,
  })

  const onPress = (): void => {
    if (isEditing || !currencyId) {
      return
    }
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigate(currencyId)
  }

  const shadowProps = useShadowPropsShort()

  const priceLoading = isNonPollingRequestInFlight(networkStatus)

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

  return (
    <ContextMenu
      actions={menuActions}
      disabled={isEditing}
      style={{ borderRadius: borderRadii.rounded16 }}
      onPress={onContextMenuPress}
      {...rest}
    >
      <AnimatedTouchableArea
        activeOpacity={isEditing ? 1 : undefined}
        backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
        borderColor={isDarkMode ? '$transparent' : colors.surface3.val}
        borderRadius="$rounded16"
        overflow={isIOS ? 'hidden' : 'visible'}
        borderWidth={isDarkMode ? '$none' : '$spacing1'}
        testID={`token-box-${token?.symbol}`}
        onLongPress={disableOnPress}
        onPress={onPress}
        {...shadowProps}
      >
        <Flex alignItems="flex-start" gap="$spacing8" p="$spacing12">
          <Flex row gap="$spacing4" justifyContent="space-between">
            <Flex grow row alignItems="center" gap="$spacing8">
              <TokenLogo
                loading={loading}
                chainId={chainId ?? undefined}
                name={token?.name ?? undefined}
                size={imageSizes.image20}
                symbol={token?.symbol ?? undefined}
                url={token?.project?.logoUrl ?? undefined}
              />
              <Text variant="body1">{getSymbolDisplayText(token?.symbol)}</Text>
            </Flex>
            <RemoveButton visible={isEditing} onPress={onRemove} />
          </Flex>
          <Flex gap="$spacing2">
            {priceLoading ? (
              <Loader.Box
                height={fonts.heading3.lineHeight}
                width={fonts.heading3.lineHeight * 3}
                testID="loader/favorite/price"
              />
            ) : (
              <Text adjustsFontSizeToFit numberOfLines={1} variant="heading3">
                {priceFormatted}
              </Text>
            )}
            {priceLoading ? (
              <Loader.Box
                height={fonts.subheading2.lineHeight}
                width={fonts.subheading2.lineHeight * 3}
                testID="loader/favorite/priceChange"
              />
            ) : (
              <RelativeChange
                arrowSize="$icon.16"
                change={pricePercentChange ?? undefined}
                semanticColor={true}
                variant="subheading2"
              />
            )}
          </Flex>
        </Flex>
      </AnimatedTouchableArea>
    </ContextMenu>
  )
}

function getCoingeckoPrice(token?: FavoriteTokenCardQuery['token']): {
  price: number | undefined
  pricePercentChange: number | undefined
} | null {
  const market = token?.project?.markets?.[0]
  if (!market?.price?.value || !market?.pricePercentChange24h?.value) {
    return null
  }

  return {
    price: market.price.value,
    pricePercentChange: market.pricePercentChange24h.value,
  }
}

function getUniswapPrice(token?: FavoriteTokenCardQuery['token']): {
  price: number | undefined
  pricePercentChange: number | undefined
} {
  return {
    price: token?.market?.price?.value,
    pricePercentChange: token?.market?.pricePercentChange?.value,
  }
}

export default memo(FavoriteTokenCard)
