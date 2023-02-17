import { ImpactFeedbackStyle } from 'expo-haptics'
import { default as React } from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { SearchContext } from 'src/components/explore/search/SearchResultsSection'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import WarningIcon from 'src/components/tokens/WarningIcon'
import { SafetyLevel } from 'src/data/__generated__/types-and-hooks'
import {
  addToSearchHistory,
  SearchResultType,
  TokenSearchResult,
} from 'src/features/explore/searchHistorySlice'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { ElementName, MobileEventName } from 'src/features/telemetry/constants'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

type SearchTokenItemProps = {
  token: TokenSearchResult
  searchContext?: SearchContext
}

export function SearchTokenItem({ token, searchContext }: SearchTokenItemProps): JSX.Element {
  const dispatch = useAppDispatch()
  const theme = useAppTheme()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const { chainId, address, name, symbol, logoUrl, safetyLevel } = token
  const currencyId = address ? buildCurrencyId(chainId, address) : buildNativeCurrencyId(chainId)

  const onPress = (): void => {
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigate(currencyId)
    if (searchContext) {
      sendAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
        query: searchContext.query,
        selected_name: name,
        selected_address: address ?? '',
        type: 'token',
        suggestion_count: searchContext.suggestionCount,
        position: searchContext.position,
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

  return (
    <TouchableArea
      hapticFeedback
      hapticStyle={ImpactFeedbackStyle.Light}
      name={ElementName.SearchTokenItem}
      onPress={onPress}>
      <Flex row alignItems="center" gap="spacing12" px="spacing8" py="spacing12">
        <TokenLogo chainId={chainId} symbol={symbol} url={logoUrl ?? undefined} />
        <Flex gap="none">
          <Flex row alignItems="center" gap="spacing4">
            <Text color="textPrimary" variant="bodyLarge">
              {name}
            </Text>
            {(safetyLevel === SafetyLevel.Blocked || safetyLevel === SafetyLevel.StrongWarning) && (
              <WarningIcon
                height={theme.iconSizes.icon16}
                safetyLevel={safetyLevel}
                strokeColorOverride="textSecondary"
                width={theme.iconSizes.icon16}
              />
            )}
          </Flex>
          <Text color="textSecondary" variant="subheadSmall">
            {symbol.toUpperCase() ?? ''}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
