import { render, screen } from '@testing-library/react'
import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { describe, expect, it } from 'vitest'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { useFlexSlotCategoryId } from '~/pages/Explore/categories/exploreCategoryChipOptions'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

function makeCategory(id: string): TokenCategory {
  return { id, name: id, description: '', categoryClass: TokenCategoryClass.Sector, grouped: false, topTokens: [] }
}

const CATEGORIES = ['trending', 'recently-launched', 'stocks', 'majors', 'defi'].map(makeCategory)

function Harness({ selectedCategoryId }: { selectedCategoryId: string }): JSX.Element {
  const flexSlotCategoryId = useFlexSlotCategoryId({ categories: CATEGORIES, selectedCategoryId })
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
})
