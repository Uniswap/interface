import { memo, useCallback, useState } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { TokenCard } from 'uniswap/src/components/TokenSelector/items/tokens/TokenCard'
import { HorizontalTokenListProps } from 'uniswap/src/components/TokenSelector/lists/HorizontalTokenList/HorizontalTokenList'

const MAX_CARDS_PER_ROW = 5

export const HorizontalTokenList = memo(function HorizontalTokenListInner({
  tokens: suggestedTokens,
  onSelectCurrency,
  index,
  section,
  expanded,
  onExpand,
}: HorizontalTokenListProps): JSX.Element {
  const shouldShowExpansion = suggestedTokens.length > MAX_CARDS_PER_ROW
  const visibleTokens = shouldShowExpansion
    ? expanded
      ? suggestedTokens
      : suggestedTokens.slice(0, MAX_CARDS_PER_ROW - 1)
    : suggestedTokens
  const remainingCount = shouldShowExpansion ? suggestedTokens.length - MAX_CARDS_PER_ROW + 1 : 0

  // Runs animation only on expanded change
  const [expandedOnMount] = useState(() => expanded)
  const isNewExpansion = expanded && !expandedOnMount

  const handleExpand = useCallback(() => {
    onExpand?.(suggestedTokens)
  }, [onExpand, suggestedTokens])

  return (
    <Flex row gap="$spacing4" flexWrap="wrap" py="$spacing8" mx="$spacing20">
      {visibleTokens.map((token) => (
        <Flex
          key={token.currencyInfo.currencyId}
          animation={isNewExpansion ? 'quick' : undefined}
          enterStyle={isNewExpansion ? { y: -16 } : undefined}
          style={styles.fiveTokenRowCard}
        >
          <TokenCard index={index} section={section} token={token} onSelectCurrency={onSelectCurrency} />
        </Flex>
      ))}
      {!expanded && remainingCount > 0 && (
        <TouchableArea style={styles.fiveTokenRowCard} onPress={handleExpand}>
          <Flex fill centered borderRadius="$rounded16" backgroundColor="$surface2">
            <Text variant="buttonLabel3" color="$neutral2">
              {remainingCount}+
            </Text>
          </Flex>
        </TouchableArea>
      )}
    </Flex>
  )
})

const styles = {
  fiveTokenRowCard: {
    width: 'calc(20% - 4px)',
  },
}
