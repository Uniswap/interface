import { SharedEventName } from '@uniswap/analytics-events'
import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GridView } from 'ui/src/components/icons/GridView'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { bucketCategories } from 'uniswap/src/features/tokenCategories/bucketTokenCategories'
import { getCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import { getTokenCategoryClassLabel } from 'uniswap/src/features/tokenCategories/getTokenCategoryClassLabel'
import type { Category, CategoryKind } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { AdaptiveDropdown } from '~/components/Dropdowns/AdaptiveDropdown'
import { InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import { ExploreFilterChip } from '~/pages/Explore/categories/ExploreCategoryChips'
import {
  type CategoryRowStats,
  isEmptyCategoryStats,
  useNetworkScopedCategoryStats,
} from '~/pages/Explore/categories/useNetworkScopedCategoryStats'

const DROPDOWN_WIDTH = 328
const DROPDOWN_MAX_HEIGHT = 400

function CategoryRow({
  category,
  stats,
  onSelect,
}: {
  category: Category
  stats: CategoryRowStats | undefined
  onSelect: (category: Category) => void
}): JSX.Element {
  const locale = useCurrentLocale()
  const Icon = getCategoryIcon(category)
  const isEmpty = isEmptyCategoryStats(stats)
  const onPress = useEvent(() => onSelect(category))

  return (
    <InternalMenuItem
      data-testid={`${TestID.ExploreCategoryRowPrefix}${category.id}`}
      py="$spacing8"
      borderRadius="$rounded12"
      hoverStyle={{ backgroundColor: '$surface2' }}
      disabled={isEmpty}
      pointerEvents={isEmpty ? 'none' : 'auto'}
      onPress={isEmpty ? undefined : onPress}
    >
      <Flex row alignItems="center" gap="$spacing12" flexShrink={1} minWidth={0}>
        <Icon size="$icon.20" color="$neutral2" />
        <Flex row alignItems="center" gap="$spacing8" flexShrink={1} minWidth={0}>
          <Text variant="body2" color="$neutral1" numberOfLines={1}>
            {category.name}
          </Text>
          {stats !== undefined && (
            <Text variant="body3" color="$neutral3">
              {stats.count.toLocaleString(locale)}
            </Text>
          )}
        </Flex>
      </Flex>
      <RelativeChange change={stats?.change24hPct} variant="body3" arrowSize="$icon.12" />
    </InternalMenuItem>
  )
}

/** "More" control at the end of the Explore category chip row, listing every category bucketed by class. */
export function MoreCategoriesDropdown<K extends CategoryKind>({
  kind,
  categories,
  selectedCategoryId,
  position,
  onSelectCategory,
}: {
  kind: K
  /** Ordered category list of that kind; buckets preserve this order. */
  categories: Extract<Category, { kind: K }>[]
  selectedCategoryId?: string
  /** Slot of the More control in the chip row, for analytics. */
  position: number
  onSelectCategory: (categoryId: string) => void
}): JSX.Element {
  const { t } = useTranslation()
  const trace = useTrace()
  const [isOpen, toggleOpen] = useState(false)
  const buckets = useMemo(() => bucketCategories(categories), [categories])
  const { getScopedStats } = useNetworkScopedCategoryStats(kind)

  // Only the trigger opens the menu (outside clicks only close it), so this is the one place an open happens.
  const onToggleOpen = useEvent((): void => {
    if (!isOpen) {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        ...trace,
        element: ElementName.ExploreCategoryViewMore,
        section: SectionName.ExploreCategoryChips,
        tab_position: position,
      })
    }
    toggleOpen(!isOpen)
  })

  const onSelect = useEvent((category: Category): void => {
    toggleOpen(false)
    if (category.id === selectedCategoryId) {
      return
    }
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.ExploreCategoryView,
      section: SectionName.ExploreCategoryChips,
      tab: category.id,
      category_id: category.id,
      is_from_more_menu: true,
      tab_position: position,
    })
    onSelectCategory(category.id)
  })

  return (
    <AdaptiveDropdown
      isOpen={isOpen}
      toggleOpen={toggleOpen}
      // The trigger lives inside the chip row's overflow-x scroller, which would clip an inline-absolute menu.
      positionFixed
      adaptToSheet
      allowFlip
      dropdownTestId={TestID.ExploreMoreCategoriesDropdown}
      dropdownStyle={{ maxHeight: DROPDOWN_MAX_HEIGHT, width: DROPDOWN_WIDTH, py: '$spacing16' }}
      containerStyle={{ width: 'auto' }}
      trigger={
        <ExploreFilterChip
          active={isOpen}
          label={t('common.more')}
          renderIcon={(color) => <GridView size="$icon.16" color={color} />}
          renderTrailingIcon={(color) => (
            <RotatableChevron color={color} direction={isOpen ? 'up' : 'down'} size="$icon.16" />
          )}
          onPress={onToggleOpen}
        />
      }
    >
      <Flex gap="$spacing12">
        {buckets.map((bucket) => (
          <Flex key={bucket.categoryClass}>
            <Text variant="body3" color="$neutral2" px="$spacing8">
              {getTokenCategoryClassLabel(bucket.categoryClass, t)}
            </Text>
            {bucket.categories.map((category) => (
              <CategoryRow key={category.id} category={category} stats={getScopedStats(category)} onSelect={onSelect} />
            ))}
          </Flex>
        ))}
      </Flex>
    </AdaptiveDropdown>
  )
}
