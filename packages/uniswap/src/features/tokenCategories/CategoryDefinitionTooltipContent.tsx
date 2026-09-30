import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

/** Tooltip body with the category definition; the tooltip itself is the caller's. */
export function CategoryDefinitionTooltipContent({
  category,
  onPressViewAll,
}: {
  category: TokenCategory
  onPressViewAll?: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing4">
      <Text color="$neutral2" variant="body4">
        {category.description}
      </Text>
      {onPressViewAll !== undefined && (
        <TouchableArea alignSelf="flex-start" testID={TestID.CategoryDefinitionViewAll} onPress={onPressViewAll}>
          <Text color="$neutral1" variant="buttonLabel4">
            {t('common.viewAll')}
          </Text>
        </TouchableArea>
      )}
    </Flex>
  )
}
