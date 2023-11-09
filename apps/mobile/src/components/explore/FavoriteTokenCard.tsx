import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo, useCallback } from 'react'
import { ViewProps } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch } from 'src/app/hooks'
import { useExploreTokenContextMenu } from 'src/components/explore/hooks'
import RemoveButton from 'src/components/explore/RemoveButton'
import { Loader } from 'src/components/loading'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { SectionName } from 'src/features/telemetry/constants'
import { disableOnPress } from 'src/utils/disableOnPress'
import { usePollOnFocusOnly } from 'src/utils/hooks'
import { AnimatedTouchableArea, Flex, Text } from 'ui/src'
import { borderRadii, imageSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'wallet/src/components/text/RelativeChange'
import { ChainId } from 'wallet/src/constants/chains'
import { PollingInterval } from 'wallet/src/constants/misc'
import { isNonPollingRequestInFlight } from 'wallet/src/data/utils'
import { useFavoriteTokenCardQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { currencyIdToContractInput } from 'wallet/src/features/dataApi/utils'
import { removeFavoriteToken } from 'wallet/src/features/favorites/slice'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

export const FAVORITE_TOKEN_CARD_LOADER_HEIGHT = 114

type FavoriteTokenCardProps = {
  currencyId: string
  isEditing?: boolean
  setIsEditing: (update: boolean) => void
} & ViewProps

function FavoriteTokenCard({
  currencyId,
  isEditing,
  setIsEditing,
  ...rest
}: FavoriteTokenCardProps): JSX.Element {
  const dispatch = useAppDispatch()
  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const { data, networkStatus, startPolling, stopPolling } = useFavoriteTokenCardQuery({
    variables: currencyIdToContractInput(currencyId),
    // Rely on cache for fast favoriting UX, and poll for updates.
    fetchPolicy: 'cache-first',
    returnPartialData: true,
  })

  usePollOnFocusOnly(startPolling, stopPolling, PollingInterval.Fast)

  const token = data?.token

  // Mirror behavior in top tokens list, use first chain the token is on for the symbol
  const chainId = fromGraphQLChain(token?.chain) ?? ChainId.Mainnet

  const price = convertFiatAmountFormatted(
    token?.project?.markets?.[0]?.price?.value,
    NumberType.FiatTokenPrice
  )
  const pricePercentChange = token?.project?.markets?.[0]?.pricePercentChange24h?.value

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
    if (isEditing || !currencyId) return
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigate(currencyId)
  }

  if (isNonPollingRequestInFlight(networkStatus)) {
    return <Loader.Favorite height={FAVORITE_TOKEN_CARD_LOADER_HEIGHT} />
  }

  return (
    <ContextMenu
      actions={menuActions}
      disabled={isEditing}
      style={{ borderRadius: borderRadii.rounded16 }}
      onPress={onContextMenuPress}
      {...rest}>
      <AnimatedTouchableArea
        hapticFeedback
        borderRadius="$rounded16"
        entering={FadeIn}
        exiting={FadeOut}
        hapticStyle={ImpactFeedbackStyle.Light}
        m="$spacing4"
        testID={`token-box-${token?.symbol}`}
        onLongPress={disableOnPress}
        onPress={onPress}>
        <BaseCard.Shadow>
          <Flex alignItems="flex-start" gap="$spacing8">
            <Flex row gap="$spacing4" justifyContent="space-between">
              <Flex grow row alignItems="center" gap="$spacing8">
                <TokenLogo
                  chainId={chainId ?? undefined}
                  size={imageSizes.image20}
                  symbol={token?.symbol ?? undefined}
                  url={token?.project?.logoUrl ?? undefined}
                />
                <Text variant="body1">{getSymbolDisplayText(token?.symbol)}</Text>
              </Flex>
              {isEditing ? (
                <RemoveButton onPress={onRemove} />
              ) : (
                <Flex height={imageSizes.image24} />
              )}
            </Flex>
            <Flex gap="$spacing2">
              <Text adjustsFontSizeToFit numberOfLines={1} variant="heading3">
                {price}
              </Text>
              <RelativeChange
                arrowSize="$icon.16"
                change={pricePercentChange ?? undefined}
                semanticColor={true}
                variant="subheading2"
              />
            </Flex>
          </Flex>
        </BaseCard.Shadow>
      </AnimatedTouchableArea>
    </ContextMenu>
  )
}

export default memo(FavoriteTokenCard)
