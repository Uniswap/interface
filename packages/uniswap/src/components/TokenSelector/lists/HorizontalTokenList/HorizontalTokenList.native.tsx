import { memo } from 'react'
import { FlatList } from 'react-native-gesture-handler'
import { Flex } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { TokenPill } from 'uniswap/src/components/TokenSelector/items/tokens/SuggestedToken'
import { HorizontalTokenListProps } from 'uniswap/src/components/TokenSelector/lists/HorizontalTokenList/HorizontalTokenList'
import { useEvent, useMemoCompare } from 'utilities/src/react/hooks'

const CONTENT_CONTAINER_STYLE = {
  paddingHorizontal: spacing.spacing16,
  paddingVertical: spacing.spacing4,
}

export const HorizontalTokenList = memo(function _HorizontalTokenList({
  tokens,
  onSelectCurrency,
  index,
  section,
}: HorizontalTokenListProps): JSX.Element {
  const renderItem = useEvent(({ item: token }: { item: TokenOption }) => (
    <TokenPill
      key={token.currencyInfo.currencyId + token.currencyInfo.currency.chainId + section.sectionKey}
      index={index}
      section={section}
      token={token}
      onSelectCurrency={onSelectCurrency}
    />
  ))

  // The horizontal token list does not care about balance or price,
  // so we can memoize by comparing `currencyId` and ignoring other values.
  const memoizedTokens = useMemoCompare(() => tokens, areTokenCurrencyIdsEqual)

  return (
    <FlatList
      horizontal
      contentContainerStyle={CONTENT_CONTAINER_STYLE}
      data={memoizedTokens}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparatorComponent}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
    />
  )
})

function keyExtractor(token: TokenOption): string {
  return token.currencyInfo.currencyId
}

function areTokenCurrencyIdsEqual(tokensA: TokenOption[] | undefined, tokensB: TokenOption[] | undefined): boolean {
  return Boolean(
    tokensA?.length === tokensB?.length &&
      tokensA?.every(
        (token, tokenIndex) => token.currencyInfo.currencyId === tokensB?.[tokenIndex]?.currencyInfo.currencyId,
      ),
  )
}

function ItemSeparatorComponent(): JSX.Element {
  return <Flex width="$spacing8" />
}
