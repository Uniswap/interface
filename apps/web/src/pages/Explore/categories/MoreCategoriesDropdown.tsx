import { SharedEventName } from '@uniswap/analytics-events'
import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GridView } from 'ui/src/components/icons/GridView'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { bucketTokenCategories } from 'uniswap/src/features/tokenCategories/bucketTokenCategories'
import { getTokenCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import { getTokenCategoryClassLabel } from 'uniswap/src/features/tokenCategories/getTokenCategoryClassLabel'
import { TokenCategory, TokenCategoryStats } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'
import { AdaptiveDropdown } from '~/components/Dropdowns/AdaptiveDropdown'
import { InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import { ExploreFilterChip } from '~/pages/Explore/categories/ExploreCategoryChips'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

const DROPDOWN_WIDTH = 328
const DROPDOWN_MAX_HEIGHT = 400

const EMPTY_CATEGORY_STATS: TokenCategoryStats = {
  tokenCount: 0,
  priceChange24hPct: 0,
  volume1h: 0,
  volume1d: 0,
  volume1w: 0,
  volume1m: 0,
  volume1y: 0,
}

/** Category stats scoped to the Explore network filter; empty on those chains reads as zeroed stats. */
function useNetworkScopedStats(): (category: TokenCategory) => TokenCategoryStats | undefined {
  const chainId = useChainIdFromUrlParam()
  const chainIds = useMemo(() => (chainId ? [chainId] : undefined), [chainId])
  const { data: scopedCategories, isPlaceholderData } = useListCategoriesQuery({ chainIds })

  return useMemo(() => {
    // keepPreviousData serves the prior chain's stats on a network switch; fall back until the scoped
    // response lands so a category empty on the previous chain isn't wrongly disabled on this one.
    if (!scopedCategories || isPlaceholderData) {
      return (category: TokenCategory) => category.stats
    }
    const scopedStatsById = new Map(scopedCategories.map((category) => [category.id, category.stats]))
    return (category: TokenCategory) => scopedStatsById.get(category.id) ?? EMPTY_CATEGORY_STATS
  }, [scopedCategories, isPlaceholderData])
}

function CategoryRow({
  category,
  stats,
  onSelect,
}: {
  category: TokenCategory
  stats: TokenCategoryStats | undefined
  onSelect: (category: TokenCategory) => void
}): JSX.Element {
  const locale = useCurrentLocale()
  const Icon = getTokenCategoryIcon(category)
  const isEmpty = stats?.tokenCount === 0
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
              {stats.tokenCount.toLocaleString(locale)}
            </Text>
          )}
        </Flex>
      </Flex>
      <RelativeChange change={stats?.priceChange24hPct} variant="body3" arrowSize="$icon.12" />
    </InternalMenuItem>
  )
}

/** "More" control at the end of the Explore category chip row, listing every category bucketed by class. */
export function MoreCategoriesDropdown({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: {
  /** Ordered category list; buckets preserve this order. */
  categories: TokenCategory[]
  selectedCategoryId?: string
  onSelectCategory: (categoryId: string) => void
}): JSX.Element {
  const { t } = useTranslation()
  const [isOpen, toggleOpen] = useState(false)
  const buckets = useMemo(() => bucketTokenCategories(categories), [categories])
  const getScopedStats = useNetworkScopedStats()
  const onToggleOpen = useEvent(() => toggleOpen((open) => !open))

  const onSelect = useEvent((category: TokenCategory): void => {
    toggleOpen(false)
    if (category.id === selectedCategoryId) {
      return
    }
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.ExploreMoreCategoriesDropdown,
      tab: category.id,
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
