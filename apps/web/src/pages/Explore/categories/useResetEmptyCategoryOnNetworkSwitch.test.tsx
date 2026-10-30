import { act, renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import type { ReactNode } from 'react'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import {
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'
import { useResetEmptyCategoryOnNetworkSwitch } from '~/pages/Explore/categories/useResetEmptyCategoryOnNetworkSwitch'
import { mocked } from '~/test-utils/mocked'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

vi.mock('~/utils/params/chainParams', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/utils/params/chainParams')>()),
  useChainIdFromUrlParam: vi.fn(),
}))

const CATEGORIES = [tokenCategory({ id: 'stocks' }), tokenCategory({ id: 'majors' })]

interface ResetProps {
  category: string
  emptyIds: string[]
  scopedStatsPending: boolean
}

function wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <ExploreTablesFilterStoreContextProvider>{children}</ExploreTablesFilterStoreContextProvider>
}

function renderReset(initialProps: ResetProps) {
  const setCategory = vi.fn()
  const rendered = renderHook(
    ({ category, emptyIds, scopedStatsPending }: ResetProps) => ({
      ...useResetEmptyCategoryOnNetworkSwitch({
        category,
        setCategory,
        categories: CATEGORIES,
        isCategoryEmpty: (candidate) => emptyIds.includes(candidate.id),
        scopedStatsPending,
      }),
      categoryCheckChainId: useExploreTablesFilterStore((s) => s.categoryCheckChainId),
      actions: useExploreTablesFilterStoreActions(),
    }),
    { initialProps, wrapper },
  )
  return { ...rendered, setCategory }
}

/** What a network filter pick does: mark the check, then the URL moves to the new chain. */
function pickNetwork(
  { result, rerender }: ReturnType<typeof renderReset>,
  props: ResetProps,
  chainId = UniverseChainId.Celo,
): void {
  act(() => result.current.actions.setCategoryCheckChainId(chainId))
  mocked(useChainIdFromUrlParam).mockReturnValue(chainId)
  rerender(props)
}

describe('useResetEmptyCategoryOnNetworkSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useChainIdFromUrlParam).mockReturnValue(UniverseChainId.Base)
  })

  it('keeps an empty category reached without a network pick, e.g. a deep link or history navigation', () => {
    const rendered = renderReset({ category: 'stocks', emptyIds: [], scopedStatsPending: false })

    mocked(useChainIdFromUrlParam).mockReturnValue(UniverseChainId.Celo)
    rendered.rerender({ category: 'stocks', emptyIds: ['stocks'], scopedStatsPending: false })

    expect(rendered.result.current.category).toBe('stocks')
    expect(rendered.setCategory).not.toHaveBeenCalled()
  })

  it('waits for the picked network stats, then resets an empty selection to All', () => {
    const rendered = renderReset({ category: 'stocks', emptyIds: [], scopedStatsPending: false })

    pickNetwork(rendered, { category: 'stocks', emptyIds: [], scopedStatsPending: true })
    expect(rendered.result.current).toMatchObject({ category: 'stocks', awaitingNetworkStats: true })
    expect(rendered.setCategory).not.toHaveBeenCalled()

    rendered.rerender({ category: 'stocks', emptyIds: ['stocks'], scopedStatsPending: false })
    expect(rendered.result.current.category).toBe(ExploreCategory.All)
    expect(rendered.setCategory).toHaveBeenCalledWith(ExploreCategory.All)

    // Before the URL catches up, the old category must not resurface.
    rendered.rerender({ category: 'stocks', emptyIds: ['stocks'], scopedStatsPending: false })
    expect(rendered.result.current.category).toBe(ExploreCategory.All)

    rendered.rerender({ category: ExploreCategory.All, emptyIds: ['stocks'], scopedStatsPending: false })
    expect(rendered.result.current).toMatchObject({
      category: ExploreCategory.All,
      awaitingNetworkStats: false,
      categoryCheckChainId: undefined,
    })
    expect(rendered.setCategory).toHaveBeenCalledTimes(1)
  })

  it('waits for the router before checking, since the pick lands in the store first', () => {
    const rendered = renderReset({ category: 'stocks', emptyIds: ['stocks'], scopedStatsPending: false })

    act(() => rendered.result.current.actions.setCategoryCheckChainId(UniverseChainId.Celo))

    expect(rendered.result.current.categoryCheckChainId).toBe(UniverseChainId.Celo)
    expect(rendered.setCategory).not.toHaveBeenCalled()
  })

  it('drops a pick abandoned before its stats land, so a later visit to that network keeps the category', () => {
    const rendered = renderReset({ category: 'stocks', emptyIds: [], scopedStatsPending: false })

    pickNetwork(rendered, { category: 'stocks', emptyIds: [], scopedStatsPending: true }, UniverseChainId.Ink)
    mocked(useChainIdFromUrlParam).mockReturnValue(UniverseChainId.Base)
    rendered.rerender({ category: 'stocks', emptyIds: [], scopedStatsPending: false })
    expect(rendered.result.current.categoryCheckChainId).toBeUndefined()

    mocked(useChainIdFromUrlParam).mockReturnValue(UniverseChainId.Ink)
    rendered.rerender({ category: 'stocks', emptyIds: ['stocks'], scopedStatsPending: false })
    expect(rendered.result.current.category).toBe('stocks')
    expect(rendered.setCategory).not.toHaveBeenCalled()
  })

  it('keeps a newer pick when the user picks again before the first one settles', () => {
    const rendered = renderReset({ category: 'stocks', emptyIds: [], scopedStatsPending: false })

    pickNetwork(rendered, { category: 'stocks', emptyIds: [], scopedStatsPending: true }, UniverseChainId.Ink)
    pickNetwork(rendered, { category: 'stocks', emptyIds: [], scopedStatsPending: true })
    expect(rendered.result.current).toMatchObject({
      awaitingNetworkStats: true,
      categoryCheckChainId: UniverseChainId.Celo,
    })

    rendered.rerender({ category: 'stocks', emptyIds: ['stocks'], scopedStatsPending: false })
    expect(rendered.setCategory).toHaveBeenCalledWith(ExploreCategory.All)
  })

  it.each([
    { name: 'a selection with tokens on the picked network', category: 'majors' },
    { name: 'All', category: ExploreCategory.All },
  ])('keeps $name and clears the check', ({ category }) => {
    const rendered = renderReset({ category, emptyIds: [], scopedStatsPending: false })

    pickNetwork(rendered, { category, emptyIds: ['stocks'], scopedStatsPending: false })

    expect(rendered.result.current).toMatchObject({ category, categoryCheckChainId: undefined })
    expect(rendered.setCategory).not.toHaveBeenCalled()
  })
})
