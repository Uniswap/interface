import { ImpactFeedbackStyle } from 'expo-haptics'
import { default as React } from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
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
import { ElementName } from 'src/features/telemetry/constants'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

type SearchTokenItemProps = {
  token: TokenSearchResult
}

export function SearchTokenItem({ token }: SearchTokenItemProps): JSX.Element {
  const dispatch = useAppDispatch()
  const theme = useAppTheme()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const { chainId, address, name, symbol, logoUrl, safetyLevel } = token
  const currencyId = address ? buildCurrencyId(chainId, address) : buildNativeCurrencyId(chainId)

  const onPress = (): void => {
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigate(currencyId)
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
      <Flex row alignItems="center" gap="sm" px="xs" py="sm">
        <TokenLogo chainId={chainId} symbol={symbol} url={logoUrl ?? undefined} />
        <Flex gap="none">
          <Flex row alignItems="center" gap="xxs">
            <Text color="textPrimary" variant="bodyLarge">
              {name}
            </Text>
            {(safetyLevel === SafetyLevel.Blocked || safetyLevel === SafetyLevel.StrongWarning) && (
              <WarningIcon
                height={theme.iconSizes.sm}
                safetyLevel={safetyLevel}
                strokeColorOverride="textSecondary"
                width={theme.iconSizes.sm}
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
