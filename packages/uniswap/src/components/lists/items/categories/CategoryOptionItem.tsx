import { Flex, iconSizes, type ModifierPressProps, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { GridView } from 'ui/src/components/icons/GridView'
import { FocusedRowControl, OptionItem } from 'uniswap/src/components/lists/items/OptionItem'
import type { CategoryOption } from 'uniswap/src/components/lists/items/types'
import { getTokenCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import { TokenLogoPile } from 'uniswap/src/features/tokenCategories/TokenLogoPile'

const ICON_TILE_SIZE = iconSizes.icon40
const PILE_LOGO_SIZE = iconSizes.icon24

interface CategoryOptionItemProps extends ModifierPressProps {
  option: CategoryOption
  onPress: () => void
  focusedRowControl?: FocusedRowControl
}

function CategoryOptionItemInner({
  option,
  onPress,
  focusedRowControl,
  modifierPressHref,
  onModifierPress,
}: CategoryOptionItemProps): JSX.Element {
  const { t } = useTranslation()
  const { category } = option
  const Icon = getTokenCategoryIcon(category)
  const tokenCount = category.stats?.tokenCount

  return (
    <OptionItem
      image={
        <Flex
          centered
          backgroundColor="$accent2"
          borderRadius="$rounded12"
          height={ICON_TILE_SIZE}
          width={ICON_TILE_SIZE}
        >
          <Icon color="$accent1" size="$icon.20" />
        </Flex>
      }
      title={category.name}
      subtitle={
        <Flex row alignItems="center" gap="$spacing4">
          <GridView color="$neutral2" size="$icon.16" />
          <Text color="$neutral2" numberOfLines={1} variant="body3">
            {t('explore.collections.single')}
          </Text>
        </Flex>
      }
      rightElement={
        <Flex row alignItems="center" gap="$spacing12">
          {tokenCount !== undefined && (
            <Text color="$neutral1" numberOfLines={1} variant="body2">
              {t('categoryDetails.tokenCount', { count: tokenCount })}
            </Text>
          )}
          <TokenLogoPile size={PILE_LOGO_SIZE} tokens={category.topTokens} />
        </Flex>
      }
      testID={`${TestID.SearchCategoryRowPrefix}${category.id}`}
      focusedRowControl={focusedRowControl}
      modifierPressHref={modifierPressHref}
      onModifierPress={onModifierPress}
      onPress={onPress}
    />
  )
}

export const CategoryOptionItem = memo(CategoryOptionItemInner)
