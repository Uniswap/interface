import { SharedEventName } from '@uniswap/analytics-events'
import type { UniverseChainId } from '@universe/chains'
import { useIsPoolCategoriesEnabled } from '@universe/gating'
import { Flex, iconSizes, spacing, Text, TouchableArea } from '@universe/mycelium'
import { TestID, type TestIDType } from '@universe/test'
import { memo, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useResolvePoolCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useResolvePoolCategories'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { CategoryHoverCard } from '~/components/HoverCard/CategoryHoverCard/CategoryHoverCard'
import { LoadingBubble } from '~/components/Tokens/loading'
import { edgeFadeMaskStyle, useHorizontalScrollFades } from '~/hooks/useHorizontalScrollFades'
import {
  type CategoryDetailsNavState,
  createCategoryDetailsNavState,
} from '~/pages/Explore/CategoryDetails/categoryDetailsEntryPoint'
import { getCategoryDetailsURL } from '~/pages/Explore/CategoryDetails/getCategoryDetailsURL'

// Same chip geometry as the TDP collections row so the two detail pages line up.
const CHIP_HEIGHT = iconSizes.icon16 + 2 * spacing.spacing6
const SKELETON_CHIP_WIDTHS = [82, 114, 78]

interface PoolDetailsHeaderCategoryChipsProps {
  /** `PoolSummary.category_ids` in BE precedence order; undefined while the pool is still loading. */
  categoryIds: string[] | undefined
  poolLoading: boolean
  chainId: UniverseChainId | undefined
  poolAddress: string | undefined
  /** Breadcrumb label on the category page, e.g. "USDC / ETH". */
  poolName: string
}

/** One chip per category the pool belongs to, in canonical order; each links to the pool category page. */
export const PoolDetailsHeaderCategoryChips = memo(function PoolDetailsHeaderCategoryChips({
  categoryIds,
  poolLoading,
  chainId,
  poolAddress,
  poolName,
}: PoolDetailsHeaderCategoryChipsProps): JSX.Element | null {
  const poolCategoriesEnabled = useIsPoolCategoriesEnabled()
  const { categories, isLoading } = useResolvePoolCategories({ categoryIds, isLoading: poolLoading })

  if (!poolCategoriesEnabled) {
    return null
  }

  if (categories.length > 0) {
    return <CategoryChipRow categories={categories} chainId={chainId} poolAddress={poolAddress} poolName={poolName} />
  }

  // A pool with no ids reserves nothing; only an unresolved lookup for a tagged pool shows the skeleton.
  if (!isLoading || (categoryIds !== undefined && categoryIds.length === 0)) {
    return null
  }

  return (
    <ChipRow testID={TestID.PoolDetailsCollections}>
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

function CategoryChipRow({
  categories,
  chainId,
  poolAddress,
  poolName,
}: {
  categories: PoolCategory[]
  chainId: UniverseChainId | undefined
  poolAddress: string | undefined
  poolName: string
}): JSX.Element {
  const navigate = useNavigate()
  const trace = useTrace()
  const { scrollerRef, edgeFades } = useHorizontalScrollFades()
  const getNavigationState = useEvent(() => createCategoryDetailsNavState({ label: poolName }))

  const logCategoryPress = useEvent((category: PoolCategory, index: number): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.PDPCollectionsChip,
      category_id: category.id,
      category_kind: category.kind,
      category_index: index,
      pool_address: poolAddress,
      chain_id: chainId,
      tags_rendered_count: categories.length,
    })
  })

  const onPressCategory = useEvent((category: PoolCategory, index: number): void => {
    logCategoryPress(category, index)
    navigate(getCategoryDetailsURL(category.id, category.kind), { state: getNavigationState() })
  })

  return (
    <Flex
      ref={scrollerRef}
      maxWidth="100%"
      className="scrollbar-hidden"
      testID={TestID.PoolDetailsCollections}
      $platform-web={{ overflowX: 'auto', overscrollBehaviorX: 'none', ...edgeFadeMaskStyle(edgeFades) }}
    >
      <ChipRow>
        {categories.map((category, index) => (
          <CategoryChip
            key={category.id}
            category={category}
            index={index}
            getNavigationState={getNavigationState}
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
  getNavigationState,
  onPress,
  onModifierPress,
}: {
  category: PoolCategory
  index: number
  getNavigationState: () => CategoryDetailsNavState | undefined
  onPress: (category: PoolCategory, index: number) => void
  onModifierPress: (category: PoolCategory, index: number) => void
}): JSX.Element {
  const Icon = getCategoryIcon(category)
  const onPressChip = useEvent(() => onPress(category, index))
  const onModifierPressChip = useEvent(() => onModifierPress(category, index))

  return (
    <CategoryHoverCard category={category} section={SectionName.PoolDetails} getNavigationState={getNavigationState}>
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
        modifierPressHref={getCategoryDetailsURL(category.id, category.kind)}
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
