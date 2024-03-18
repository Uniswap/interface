import { ImpactFeedbackStyle } from 'expo-haptics'
import { default as React } from 'react'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch } from 'src/app/hooks'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { useExploreTokenContextMenu } from 'src/components/explore/hooks'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { disableOnPress } from 'src/utils/disableOnPress'
import { Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import WarningIcon from 'wallet/src/components/icons/WarningIcon'
import { SearchContext } from 'wallet/src/features/search/SearchContext'
import { SearchResultType, TokenSearchResult } from 'wallet/src/features/search/SearchResult'
import { addToSearchHistory } from 'wallet/src/features/search/searchHistorySlice'
import { ElementName, SectionName } from 'wallet/src/telemetry/constants'
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
          <TokenLogo chainId={chainId} name={name} symbol={symbol} url={logoUrl ?? undefined} />
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
