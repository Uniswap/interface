import { memo, useCallback } from 'react'
import { FlatList } from 'react-native-gesture-handler'
import { Flex } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { HorizontalTokenListProps } from 'uniswap/src/components/TokenSelector/HorizontalTokenList/HorizontalTokenList'
import { SuggestedToken } from 'uniswap/src/components/TokenSelector/SuggestedToken'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export const HorizontalTokenList = memo(function _HorizontalTokenList({
  tokens: suggestedTokens,
  onSelectCurrency,
  index,
  section,
}: HorizontalTokenListProps): JSX.Element {
  const isBridgingEnabled = useFeatureFlag(FeatureFlags.Bridging)

  const itemSeparatorComponent = useCallback(() => <Flex width="$spacing8" />, [])

  if (!isBridgingEnabled) {
    return (
      <Flex row flexWrap="wrap" gap="$spacing8" py="$spacing8" px="$spacing16">
        {suggestedTokens.map((token) => (
          <SuggestedToken
            key={token.currencyInfo.currencyId}
            index={index}
            section={section}
            token={token}
            onSelectCurrency={onSelectCurrency}
          />
        ))}
      </Flex>
    )
  }

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
        <SuggestedToken
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
