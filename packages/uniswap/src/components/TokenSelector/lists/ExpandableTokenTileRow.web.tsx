import { ReactNode, useState } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { useEvent } from 'utilities/src/react/hooks'

const MAX_CARDS_PER_ROW = 5

// 5 cards + 4 gaps ($spacing4 = 4px each = 16px total) per row: each card subtracts its
// share of the gaps (16px / 5 = 3.2px) so the row fills exactly, with no trailing gap.
const CARD_WIDTH = 'calc(20% - 3.2px)'

type ExpandableTokenTileRowProps<T> = {
  tokens: T[]
  keyExtractor: (token: T) => string
  renderTile: (token: T) => ReactNode
  expanded?: boolean
  onExpand?: (tokens: T[]) => void
}

/** Wrapping grid of token tiles (5 per row) with an "N+" control that expands to reveal the rest. */
export function ExpandableTokenTileRow<T>({
  tokens,
  keyExtractor,
  renderTile,
  expanded,
  onExpand,
}: ExpandableTokenTileRowProps<T>): JSX.Element {
  const shouldShowExpansion = tokens.length > MAX_CARDS_PER_ROW
  const visibleTokens = shouldShowExpansion ? (expanded ? tokens : tokens.slice(0, MAX_CARDS_PER_ROW - 1)) : tokens
  const remainingCount = shouldShowExpansion ? tokens.length - MAX_CARDS_PER_ROW + 1 : 0

  // Animate only when the row expands after mount, not when it mounts already-expanded.
  const [expandedOnMount] = useState(() => expanded)
  const isNewExpansion = expanded && !expandedOnMount

  const handleExpand = useEvent(() => onExpand?.(tokens))

  return (
    <Flex row gap="$spacing4" flexWrap="wrap" pb="$spacing8" mx="$spacing16">
      {visibleTokens.map((token) => (
        <Flex
          key={keyExtractor(token)}
          animation={isNewExpansion ? 'quick' : undefined}
          enterStyle={isNewExpansion ? { y: -16 } : undefined}
          width={CARD_WIDTH}
        >
          {renderTile(token)}
        </Flex>
      ))}
      {!expanded && remainingCount > 0 && (
        <TouchableArea width={CARD_WIDTH} onPress={handleExpand}>
          <Flex fill centered borderRadius="$rounded16" backgroundColor="$surface2">
            <Text color="$neutral2" variant="buttonLabel3">
              {remainingCount}+
            </Text>
          </Flex>
        </TouchableArea>
      )}
    </Flex>
  )
}
