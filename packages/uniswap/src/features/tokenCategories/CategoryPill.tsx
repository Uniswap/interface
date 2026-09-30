import {
  type ColorTokens,
  Flex,
  fonts,
  spacing,
  type SpaceTokens,
  Text,
  TouchableArea,
  type TouchableAreaProps,
} from '@universe/mycelium'
import type { ReactNode } from 'react'
import { getTokenCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

// Exact rendered height so skeletons don't shift content when the query resolves.
export const CATEGORY_PILL_HEIGHT = fonts.buttonLabel3.lineHeight + 2 * spacing.spacing8 + 2 * spacing.spacing1

type PillTouchableProps = Pick<
  TouchableAreaProps,
  'accessibilityLabel' | 'accessibilityRole' | 'aria-selected' | 'testID'
>

export function Pill({
  gap,
  active = false,
  onPress,
  children,
  ...touchableProps
}: {
  gap: SpaceTokens
  active?: boolean
  onPress: () => void
  children: ReactNode
} & PillTouchableProps): JSX.Element {
  return (
    <TouchableArea onPress={onPress} {...touchableProps}>
      <Flex
        centered
        row
        backgroundColor={active ? '$surface3' : '$surface1'}
        borderColor="$surface3"
        borderRadius="$roundedFull"
        borderWidth="$spacing1"
        gap={gap}
        hoverStyle={{ backgroundColor: active ? '$surface3Hovered' : '$surface2Hovered' }}
        px="$spacing12"
        py="$spacing8"
      >
        {children}
      </Flex>
    </TouchableArea>
  )
}

/** `color` tints icon and label together; default is accent icon with primary text. */
export function CategoryPill({
  category,
  color,
  onPress,
}: {
  category: TokenCategory
  color?: ColorTokens
  onPress: () => void
}): JSX.Element {
  const Icon = getTokenCategoryIcon(category)

  return (
    <Pill gap="$spacing6" onPress={onPress}>
      <Icon color={color ?? '$accent1'} size="$icon.16" />
      <Text color={color} variant="buttonLabel3">
        {category.name}
      </Text>
    </Pill>
  )
}
