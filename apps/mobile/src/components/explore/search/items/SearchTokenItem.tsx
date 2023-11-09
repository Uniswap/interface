import { ImpactFeedbackStyle } from 'expo-haptics'
import { default as React } from 'react'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch } from 'src/app/hooks'
import { useExploreTokenContextMenu } from 'src/components/explore/hooks'
import { SearchContext } from 'src/components/explore/search/SearchContext'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import WarningIcon from 'src/components/tokens/WarningIcon'
import { addToSearchHistory } from 'src/features/explore/searchHistorySlice'
import { SearchResultType, TokenSearchResult } from 'src/features/explore/SearchResult'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { ElementName, MobileEventName, SectionName } from 'src/features/telemetry/constants'
import { disableOnPress } from 'src/utils/disableOnPress'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { SafetyLevel } from 'wallet/src/data/__generated__/types-and-hooks'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'
import { shortenAddress } from 'wallet/src/utils/addresses'
import { buildCurrencyId, buildNativeCurrencyId } from 'wallet/src/utils/currencyId'

type SearchTokenItemProps = {
  token: TokenSearchResult
  searchContext?: SearchContext
}

export function SearchTokenItem({ token, searchContext }: SearchTokenItemProps): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const dispatch = useAppDispatch()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const { chainId, address, name, symbol, logoUrl, safetyLevel } = token
  const currencyId = address ? buildCurrencyId(chainId, address) : buildNativeCurrencyId(chainId)

  const onPress = (): void => {
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigate(currencyId)
    if (searchContext) {
      sendMobileAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
        query: searchContext.query,
        name: name ?? '',
        chain: token.chainId,
        address: address ?? '',
        type: 'token',
        suggestion_count: searchContext.suggestionCount,
        position: searchContext.position,
        isHistory: searchContext.isHistory,
      })
    }
    dispatch(
      addToSearchHistory({
        searchResult: {
          type: SearchResultType.Token,
          chainId,
          address,
          name,
          symbol,
          logoUrl,
          safetyLevel,
        },
      })
    )
  }

  const { menuActions, onContextMenuPress } = useExploreTokenContextMenu({
    chainId,
    currencyId,
    analyticsSection: SectionName.ExploreSearch,
  })

  return (
    <ContextMenu actions={menuActions} onPress={onContextMenuPress}>
      <TouchableArea
        hapticFeedback
        hapticStyle={ImpactFeedbackStyle.Light}
        testID={ElementName.SearchTokenItem}
        onLongPress={disableOnPress}
        onPress={onPress}>
        <Flex row alignItems="center" gap="$spacing12" px="$spacing8" py="$spacing12">
          <TokenLogo chainId={chainId} symbol={symbol} url={logoUrl ?? undefined} />
          <Flex shrink alignItems="flex-start">
            <Flex centered row gap="$spacing8">
              <Flex shrink>
                <Text color="$neutral1" numberOfLines={1} variant="body1">
                  {name}
                </Text>
              </Flex>
              {(safetyLevel === SafetyLevel.Blocked ||
                safetyLevel === SafetyLevel.StrongWarning) && (
                <WarningIcon
                  height={iconSizes.icon16}
                  safetyLevel={safetyLevel}
                  strokeColorOverride="neutral3"
                  width={iconSizes.icon16}
                />
              )}
            </Flex>
            <Flex centered row gap="$spacing8">
              <Text color="$neutral2" numberOfLines={1} variant="subheading2">
                {symbol}
              </Text>
              {address && (
                <Flex shrink>
                  <Text
                    color={isDarkMode ? '$neutral3' : '$neutral2'}
                    numberOfLines={1}
                    variant="subheading2">
                    {shortenAddress(address)}
                  </Text>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}
