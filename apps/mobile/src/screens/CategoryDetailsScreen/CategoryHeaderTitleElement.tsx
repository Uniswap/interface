import { Flex, Text } from '@universe/mycelium'
import React, { memo } from 'react'
import { getCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

/** Category icon + name shown in the sticky toolbar once the page header scrolls away. */
export const CategoryHeaderTitleElement = memo(function CategoryHeaderTitleElement({
  category,
}: {
  category: TokenCategory
}): JSX.Element {
  const Icon = getCategoryIcon(category)

  return (
    // No ml offset (unlike the TDP title): this screen's right side is just ScrollHeader's default
    // 24px spacer, which mirrors the back button, so the title centers naturally.
    <Flex centered row gap="$spacing8">
      <Flex centered borderRadius="$rounded6" backgroundColor="$accent2" p="$spacing4">
        <Icon color="$accent1" size="$icon.12" />
      </Flex>
      <Text variant="body1" color="$neutral1">
        {category.name}
      </Text>
    </Flex>
  )
})
