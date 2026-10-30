import { render, screen } from '@testing-library/react'
import { type Category, TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { describe, expect, it } from 'vitest'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { useFlexSlotCategoryId } from '~/pages/Explore/categories/exploreCategoryChipOptions'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

function makeCategory(id: string): TokenCategory {
  return {
    id,
    name: id,
    englishName: id,
    description: '',
    kind: 'token',
    categoryClass: TokenCategoryClass.Sector,
    grouped: false,
    topTokens: [],
    topGroups: [],
  }
}

const CATEGORIES = ['trending', 'recently-launched', 'stocks', 'majors', 'defi'].map(makeCategory)

function Harness({
  selectedCategoryId,
  isCategoryEmpty = (): boolean => false,
}: {
  selectedCategoryId: string
  isCategoryEmpty?: (category: Category) => boolean
}): JSX.Element {
  const flexSlotCategoryId = useFlexSlotCategoryId({
    kind: 'token',
    categories: CATEGORIES,
    selectedCategoryId,
    isCategoryEmpty,
  })
  return <span data-testid="flex-slot">{flexSlotCategoryId ?? 'none'}</span>
}

describe('useFlexSlotCategoryId', () => {
  it('remembers a non-spotlit selection and keeps it after moving back to All', () => {
    const { rerender } = render(
      <ExploreTablesFilterStoreContextProvider>
        <Harness selectedCategoryId="defi" />
      </ExploreTablesFilterStoreContextProvider>,
    )
    expect(screen.getByTestId('flex-slot').textContent).toBe('defi')

    rerender(
      <ExploreTablesFilterStoreContextProvider>
        <Harness selectedCategoryId={ExploreCategory.All} />
      </ExploreTablesFilterStoreContextProvider>,
    )
    expect(screen.getByTestId('flex-slot').textContent).toBe('defi')
  })

  it('survives the chip row unmounting and remounting under the same store', () => {
    const { rerender } = render(
      <ExploreTablesFilterStoreContextProvider>
        <Harness selectedCategoryId="defi" />
      </ExploreTablesFilterStoreContextProvider>,
    )

    rerender(<ExploreTablesFilterStoreContextProvider>{null}</ExploreTablesFilterStoreContextProvider>)
    rerender(
      <ExploreTablesFilterStoreContextProvider>
        <Harness selectedCategoryId={ExploreCategory.All} />
      </ExploreTablesFilterStoreContextProvider>,
    )

    expect(screen.getByTestId('flex-slot').textContent).toBe('defi')
  })

  it('treats a category backfilled into the spotlit row as spotlit', () => {
    render(
      <ExploreTablesFilterStoreContextProvider>
        <Harness selectedCategoryId="defi" isCategoryEmpty={(category) => category.id === 'stocks'} />
      </ExploreTablesFilterStoreContextProvider>,
    )
    expect(screen.getByTestId('flex-slot').textContent).toBe('none')
  })

  it('claims the flex slot for a selected category that is empty, even if it heads the order', () => {
    render(
      <ExploreTablesFilterStoreContextProvider>
        <Harness selectedCategoryId="trending" isCategoryEmpty={(category) => category.id === 'trending'} />
      </ExploreTablesFilterStoreContextProvider>,
    )
    expect(screen.getByTestId('flex-slot').textContent).toBe('trending')
  })
})
