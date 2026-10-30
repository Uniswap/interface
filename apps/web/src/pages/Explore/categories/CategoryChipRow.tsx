import { Flex } from '@universe/mycelium'
import type { Category, CategoryKind } from 'uniswap/src/features/tokenCategories/types'
import { edgeFadeMaskStyle, useHorizontalScrollFades } from '~/hooks/useHorizontalScrollFades'
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
  const { scrollerRef, edgeFades } = useHorizontalScrollFades()

  return (
    // Chips can exceed small viewports — scroll them in place instead of widening the page.
    <Flex
      ref={scrollerRef}
      maxWidth="100%"
      flexShrink={1}
      minWidth={0}
      className="scrollbar-hidden"
      $platform-web={{ overflowX: 'auto', overscrollBehaviorX: 'none', ...edgeFadeMaskStyle(edgeFades) }}
    >
      {loading ? (
        <ExploreCategoryChipsSkeleton />
      ) : (
        <Flex row alignItems="center" gap="$spacing4">
          <ExploreCategoryChips
            options={options}
            value={value}
            onChange={onChange}
            fadeSwapLastOption={moreCategories !== undefined}
          />
          {moreCategories && (
            <>
              <Flex height="$spacing16" width={1} backgroundColor="$surface3" flexShrink={0} />
              <MoreCategoriesDropdown
                kind={kind}
                categories={moreCategories}
                selectedCategoryId={value}
                position={options.length}
                onSelectCategory={onChange}
              />
            </>
          )}
        </Flex>
      )}
    </Flex>
  )
}
