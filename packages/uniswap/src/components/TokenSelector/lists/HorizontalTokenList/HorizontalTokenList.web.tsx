import { memo, useEffect, useRef, useState } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src/'
import { TokenCard } from 'uniswap/src/components/TokenSelector/items/tokens/TokenCard'
import { HorizontalTokenListProps } from 'uniswap/src/components/TokenSelector/lists/HorizontalTokenList/HorizontalTokenList'

const MAX_CARDS_PER_ROW = 5

export const HorizontalTokenList = memo(function _HorizontalTokenList({
  tokens: suggestedTokens,
  onSelectCurrency,
  index,
  section,
  expanded,
  onExpand,
}: HorizontalTokenListProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined)

  const shouldShowExpansion = suggestedTokens.length > MAX_CARDS_PER_ROW
  const visibleTokens = shouldShowExpansion
    ? expanded
      ? suggestedTokens
      : suggestedTokens.slice(0, MAX_CARDS_PER_ROW - 1)
    : suggestedTokens
  const remainingCount = shouldShowExpansion ? suggestedTokens.length - MAX_CARDS_PER_ROW + 1 : 0

  // biome-ignore lint/correctness/useExhaustiveDependencies: hack to animate the height of the container when the tokens get expanded
  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.scrollHeight)
    }
  }, [visibleTokens])

  return (
    <Flex
      ref={containerRef}
      key={`horizontal-token-list-${visibleTokens.length}-${index}-${section}`}
      row
      gap="$spacing4"
      flexWrap="wrap"
      py="$spacing8"
      mx="$spacing20"
      animation={expanded ? '300ms' : undefined}
      height={containerHeight}
    >
      {visibleTokens.map((token) => (
        <Flex key={token.currencyInfo.currencyId} style={styles.fiveTokenRowCard}>
          <TokenCard
            key={token.currencyInfo.currencyId}
            index={index}
            section={section}
            token={token}
            onSelectCurrency={onSelectCurrency}
          />
        </Flex>
      ))}
      {!expanded && remainingCount > 0 && (
        <TouchableArea style={styles.fiveTokenRowCard} onPress={() => onExpand?.(suggestedTokens)}>
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
