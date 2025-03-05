import { default as React } from 'react'
import ContextMenu from 'react-native-context-menu-view'
import { useDispatch } from 'react-redux'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { useExploreTokenContextMenu } from 'src/components/explore/hooks'
import { SEARCH_ITEM_ICON_SIZE, SEARCH_ITEM_PX, SEARCH_ITEM_PY } from 'src/components/explore/search/constants'
import { disableOnPress } from 'src/utils/disableOnPress'
import { Flex, Text, TouchableArea } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { getWarningIconColors } from 'uniswap/src/components/warnings/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SearchContext } from 'uniswap/src/features/search/SearchContext'
import { SearchResultType, TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { addToSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { MobileEventName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/safetyUtils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'

type SearchTokenItemProps = {
  token: TokenSearchResult
  searchContext?: SearchContext
}

export function SearchTokenItem({ token, searchContext }: SearchTokenItemProps): JSX.Element {
  const dispatch = useDispatch()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const { chainId, address, name, symbol, logoUrl, safetyInfo, feeData } = token
  const currencyId = address ? buildCurrencyId(chainId, address) : buildNativeCurrencyId(chainId as UniverseChainId)
  const currencyInfo = useCurrencyInfo(currencyId)
  const severity = getTokenWarningSeverity(currencyInfo)
  // in mobile search, we only show the warning icon if token is >=Medium severity
  const { colorSecondary: warningIconColor } = getWarningIconColors(severity)

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
          safetyInfo,
          feeData,
        },
      }),
    )
  }

  const { menuActions, onContextMenuPress } = useExploreTokenContextMenu({
    chainId: chainId as UniverseChainId,
    currencyId,
    analyticsSection: SectionName.ExploreSearch,
  })

  return (
    <ContextMenu actions={menuActions} onPress={onContextMenuPress}>
      <TouchableArea
        testID={`${TestID.SearchTokenItem}-${name}-${chainId}`}
        onLongPress={disableOnPress}
        onPress={onPress}
      >
        <Flex row alignItems="center" gap="$spacing12" px={SEARCH_ITEM_PX} py={SEARCH_ITEM_PY}>
          <TokenLogo
            chainId={chainId}
            name={name}
            symbol={symbol}
            url={logoUrl ?? undefined}
            size={SEARCH_ITEM_ICON_SIZE}
          />
          <Flex shrink alignItems="flex-start">
            <Flex centered row gap="$spacing8">
              <Flex shrink>
                <Text color="$neutral1" numberOfLines={1} variant="subheading1">
                  {name}
                </Text>
              </Flex>
              {warningIconColor && (
                <WarningIcon severity={severity} size="$icon.16" strokeColorOverride={warningIconColor} />
              )}
            </Flex>
            <Flex centered row gap="$spacing8">
              <Text color="$neutral2" numberOfLines={1} variant="body2">
                {symbol}
              </Text>
              {address && (
                <Flex shrink>
                  <Text color="$neutral3" numberOfLines={1} variant="body3">
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
