import { default as React } from 'react'
import ContextMenu from 'react-native-context-menu-view'
import { useDispatch } from 'react-redux'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { useExploreTokenContextMenu } from 'src/components/explore/hooks'
import { disableOnPress } from 'src/utils/disableOnPress'
import { Flex, ImpactFeedbackStyle, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import WarningIcon from 'uniswap/src/components/icons/WarningIcon'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { SearchContext } from 'uniswap/src/features/search/SearchContext'
import { SearchResultType } from 'uniswap/src/features/search/SearchResult'
import { MobileEventName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'uniswap/src/utils/addresses'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { TokenSearchResult } from 'wallet/src/features/search/SearchResult'
import { addToSearchHistory } from 'wallet/src/features/search/searchHistorySlice'

type SearchTokenItemProps = {
  token: TokenSearchResult
  searchContext?: SearchContext
}

export function SearchTokenItem({ token, searchContext }: SearchTokenItemProps): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const dispatch = useDispatch()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const { chainId, address, name, symbol, logoUrl, safetyLevel } = token
  const currencyId = address ? buildCurrencyId(chainId, address) : buildNativeCurrencyId(chainId)

  const onPress = (): void => {
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigate(currencyId)
    if (searchContext) {
      sendAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
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
      }),
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
        testID={TestID.SearchTokenItem}
        onLongPress={disableOnPress}
        onPress={onPress}
      >
        <Flex row alignItems="center" gap="$spacing12" px="$spacing24" py="$spacing12">
          <TokenLogo chainId={chainId} name={name} symbol={symbol} url={logoUrl ?? undefined} />
          <Flex shrink alignItems="flex-start">
            <Flex centered row gap="$spacing8">
              <Flex shrink>
                <Text color="$neutral1" numberOfLines={1} variant="body1">
                  {name}
                </Text>
              </Flex>
              {(safetyLevel === SafetyLevel.Blocked || safetyLevel === SafetyLevel.StrongWarning) && (
                <WarningIcon safetyLevel={safetyLevel} size="$icon.16" strokeColorOverride="neutral3" />
              )}
            </Flex>
            <Flex centered row gap="$spacing8">
              <Text color="$neutral2" numberOfLines={1} variant="subheading2">
                {symbol}
              </Text>
              {address && (
                <Flex shrink>
                  <Text color={isDarkMode ? '$neutral3' : '$neutral2'} numberOfLines={1} variant="subheading2">
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
