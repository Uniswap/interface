import { SharedEventName } from '@uniswap/analytics-events'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex, iconSizes, spacing, Text, TouchableArea } from '@universe/mycelium'
import { TestID, type TestIDType } from '@universe/test'
import { memo, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getTokenCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'
import { CategoryHoverCard } from '~/components/HoverCard/CategoryHoverCard/CategoryHoverCard'
import { LoadingBubble } from '~/components/Tokens/loading'
import { rightEdgeFadeStyle, useWheelHorizontalScroll } from '~/pages/Explore/categories/useWheelHorizontalScroll'
import { getCategoryDetailsURL } from '~/pages/Explore/CategoryDetails/getCategoryDetailsURL'
import { useTDPTokenCategories } from '~/pages/TokenDetails/hooks/useTDPTokenCategories'

// Fixed to the Figma frame (16px icon + 6px padding, border drawn inside) so the skeleton reserves the exact
// rendered height and the chip doesn't grow by its border.
const CHIP_HEIGHT = iconSizes.icon16 + 2 * spacing.spacing6
const SKELETON_CHIP_WIDTHS = [82, 114, 78]

/** One chip per category the token belongs to, in canonical order; each links to the Category Details page. */
export const TokenDetailsHeaderCategoryChips = memo(function TokenDetailsHeaderCategoryChips(): JSX.Element | null {
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const { categories, isLoading } = useTDPTokenCategories()

  if (!tokenCategoriesEnabled) {
    return null
  }

  if (categories.length > 0) {
    return <CategoryChipRow categories={categories} />
  }

  if (!isLoading) {
    return null
  }

  return (
    <ChipRow testID={TestID.TokenDetailsCollections}>
      {SKELETON_CHIP_WIDTHS.map((width) => (
        <LoadingBubble key={width} round height={CHIP_HEIGHT} width={width} containerProps={{ width }} />
      ))}
    </ChipRow>
  )
})

function ChipRow({ testID, children }: { testID?: TestIDType; children: ReactNode }): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing8" $sm={{ gap: '$spacing6' }} testID={testID}>
      {children}
    </Flex>
  )
}

function CategoryChipRow({ categories }: { categories: TokenCategory[] }): JSX.Element {
  const navigate = useNavigate()
  const { scrollerRef, showRightFade } = useWheelHorizontalScroll()

  const logCategoryPress = useEvent((category: TokenCategory, index: number): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.TDPCollectionsChip,
      category_id: category.id,
      category_index: index,
    })
  })

  const onPressCategory = useEvent((category: TokenCategory, index: number): void => {
    logCategoryPress(category, index)
    navigate(getCategoryDetailsURL(category.id))
  })

  return (
    <Flex
      ref={scrollerRef}
      maxWidth="100%"
      className="scrollbar-hidden"
      testID={TestID.TokenDetailsCollections}
      $platform-web={{ overflowX: 'auto', overscrollBehaviorX: 'none', ...rightEdgeFadeStyle(showRightFade) }}
    >
      <ChipRow>
        {categories.map((category, index) => (
          <CategoryChip
            key={category.id}
            category={category}
            index={index}
            onPress={onPressCategory}
            onModifierPress={logCategoryPress}
          />
        ))}
      </ChipRow>
    </Flex>
  )
}

const CategoryChip = memo(function CategoryChip({
  category,
  index,
  onPress,
  onModifierPress,
}: {
  category: TokenCategory
  index: number
  onPress: (category: TokenCategory, index: number) => void
  onModifierPress: (category: TokenCategory, index: number) => void
}): JSX.Element {
  const Icon = getTokenCategoryIcon(category)
  const onPressChip = useEvent(() => onPress(category, index))
  const onModifierPressChip = useEvent(() => onModifierPress(category, index))

  return (
    <CategoryHoverCard category={category} section={SectionName.TokenDetails}>
      <TouchableArea
        row
        alignItems="center"
        flexShrink={0}
        height={CHIP_HEIGHT}
        gap="$spacing4"
        pl="$spacing8"
        pr="$spacing12"
        borderWidth="$spacing1"
        borderColor="$surface3"
        borderRadius="$roundedFull"
        hoverStyle={{ backgroundColor: '$surface2' }}
        modifierPressHref={getCategoryDetailsURL(category.id)}
        onPress={onPressChip}
        onModifierPress={onModifierPressChip}
      >
        <Icon color="$neutral2" size="$icon.16" />
        <Text variant="buttonLabel4" color="$neutral2" $platform-web={{ whiteSpace: 'nowrap' }}>
          {category.name}
        </Text>
      </TouchableArea>
    </CategoryHoverCard>
  )
})
