import { memo, useCallback } from 'react'
import { FlatList } from 'react-native-gesture-handler'
import { Flex } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { TokenPill } from 'uniswap/src/components/TokenSelector/items/SuggestedToken'
import { HorizontalTokenListProps } from 'uniswap/src/components/TokenSelector/lists/HorizontalTokenList/HorizontalTokenList'

export const HorizontalTokenList = memo(function _HorizontalTokenList({
  tokens: suggestedTokens,
  onSelectCurrency,
  index,
  section,
}: HorizontalTokenListProps): JSX.Element {
  const itemSeparatorComponent = useCallback(() => <Flex width="$spacing8" />, [])

  return (
    <FlatList
      horizontal
      contentContainerStyle={{
        paddingHorizontal: spacing.spacing12,
        paddingVertical: spacing.spacing4,
      }}
      data={suggestedTokens}
      keyExtractor={(token) => token.currencyInfo.currencyId}
      ItemSeparatorComponent={itemSeparatorComponent}
      renderItem={({ item: token }) => (
        <TokenPill
          key={token.currencyInfo.currencyId + token.currencyInfo.currency.chainId + section.sectionKey}
          index={index}
          section={section}
          token={token}
          onSelectCurrency={onSelectCurrency}
        />
      )}
      showsHorizontalScrollIndicator={false}
    />
  )
})
