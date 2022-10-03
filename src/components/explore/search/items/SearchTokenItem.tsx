import { default as React } from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
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

export function SearchTokenItem({ token }: SearchTokenItemProps) {
  const dispatch = useAppDispatch()
  const theme = useAppTheme()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const { chainId, address, name, symbol, logoUrl } = token
  const currencyId = address ? buildCurrencyId(chainId, address) : buildNativeCurrencyId(chainId)

  const onPress = () => {
    tokenDetailsNavigation.navigate(currencyId)
    dispatch(
      addToSearchHistory({
        searchResult: { type: SearchResultType.Token, chainId, address, name, symbol, logoUrl },
      })
    )
  }

  return (
    <Button
      name={ElementName.SearchTokenItem}
      onPress={onPress}
      onPressIn={() => {
        tokenDetailsNavigation.preload(currencyId)
      }}>
      <Flex row alignItems="center" gap="sm" px="xs" py="sm">
        <TokenLogo size={theme.imageSizes.lg} symbol={symbol} url={logoUrl ?? undefined} />
        <Flex gap="none">
          <Text color="textPrimary" variant="subhead">
            {name}
          </Text>
          <Text color="textSecondary" variant="caption">
            {symbol.toUpperCase() ?? ''}
          </Text>
        </Flex>
      </Flex>
    </Button>
  )
}
