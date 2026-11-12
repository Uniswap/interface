import { Flex } from '@universe/mycelium'
import { startTransition, useOptimistic } from 'react'
import type { Category, CategoryKind } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'
import { HorizontalFadeScroller } from '~/components/HorizontalFadeScroller/HorizontalFadeScroller'
import type { ExploreCategoryChipOption } from '~/pages/Explore/categories/exploreCategoryChipOptions'
import { ExploreCategoryChips } from '~/pages/Explore/categories/ExploreCategoryChips'
import { ExploreCategoryChipsSkeleton } from '~/pages/Explore/categories/ExploreCategoryChipsSkeleton'
import { MoreCategoriesDropdown } from '~/pages/Explore/categories/MoreCategoriesDropdown'

/**
 * The Explore category chip row: skeleton while the set is unknown, else the chips and, when the
 * backend list is driving them, the divider and More dropdown. Shared by the Tokens and Pools tabs
 * so spacing, fades and the analytics slot numbering can't drift between them.
 */
export function CategoryChipRow<K extends CategoryKind>({
  kind,
  options,
  value,
  onChange,
  loading,
  moreCategories,
}: {
  kind: K
  options: ExploreCategoryChipOption[]
  value: string
  onChange: (category: string) => void
  loading: boolean
  /** Ordered backend list behind the More dropdown; undefined renders the static chip set alone. */
  moreCategories?: Extract<Category, { kind: K }>[]
}): JSX.Element {
  // The router applies `?category=` in a transition that also renders the new table; select the chip first.
  const [optimisticValue, setOptimisticValue] = useOptimistic(value)
  const onSelect = useEvent((category: string): void => {
    startTransition(() => {
      setOptimisticValue(category)
      onChange(category)
    })
  })

  return (
    // Chips can exceed small viewports — scroll them in place instead of widening the page.
    <HorizontalFadeScroller maxWidth="100%" flexShrink={1} minWidth={0} gap="$spacing4">
      {loading ? (
        <ExploreCategoryChipsSkeleton />
      ) : (
        <>
          <ExploreCategoryChips
            options={options}
            value={optimisticValue}
            onChange={onSelect}
            fadeSwapLastOption={moreCategories !== undefined}
          />
          {moreCategories && (
            <>
              <Flex height="$spacing16" width={1} backgroundColor="$surface3" flexShrink={0} />
              <MoreCategoriesDropdown
                kind={kind}
                categories={moreCategories}
                selectedCategoryId={optimisticValue}
                position={options.length}
                onSelectCategory={onSelect}
              />
            </>
          )}
        </>
      )}
    </HorizontalFadeScroller>
  )
}
