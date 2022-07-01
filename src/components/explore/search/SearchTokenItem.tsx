import { default as React } from 'react'
import { Image, ImageStyle } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { CoingeckoMarketCoin, CoingeckoSearchCoin } from 'src/features/dataApi/coingecko/types'
import {
  addToSearchHistory,
  SearchResultType,
  TokenSearchResult,
} from 'src/features/explore/searchHistorySlice'
import { ElementName } from 'src/features/telemetry/constants'
import { useCurrencyIdFromCoingeckoId } from 'src/features/tokens/useCurrency'
import { Screens } from 'src/screens/Screens'

type SearchTokenItemProps = {
  coin: CoingeckoSearchCoin | CoingeckoMarketCoin | TokenSearchResult
}

export function SearchTokenItem({ coin }: SearchTokenItemProps) {
  const { navigate } = useExploreStackNavigation()
  const dispatch = useAppDispatch()
  const _currencyId = useCurrencyIdFromCoingeckoId(coin.id)

  if (!_currencyId) return null

  const { id, name, symbol } = coin
  const uri =
    (coin as CoingeckoSearchCoin).large ||
    (coin as CoingeckoMarketCoin).image ||
    (coin as TokenSearchResult).image

  const onPress = () => {
    dispatch(
      addToSearchHistory({
        searchResult: { type: SearchResultType.Token, id, name, symbol, image: uri },
      })
    )
    navigate(Screens.TokenDetails, {
      currencyId: _currencyId,
    })
  }

  return (
    <Button name={ElementName.SearchTokenItem} onPress={onPress}>
      <Flex row alignItems="center" px="xs" py="sm">
        <Image source={{ uri }} style={logoStyle} />
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

export const logoStyle: ImageStyle = {
  height: 35,
  resizeMode: 'cover',
  width: 35,
}
