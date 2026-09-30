import { renderHook } from '@testing-library/react'
import { useResolveTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useResolveTokenCategories'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import type { TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTDPTokenCategories } from '~/pages/TokenDetails/hooks/useTDPTokenCategories'
import { mocked } from '~/test-utils/mocked'

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useResolveTokenCategories', () => ({
  useResolveTokenCategories: vi.fn(),
}))

const FIRST = tokenCategory({ id: 'stablecoins', name: 'Stablecoins' })
const SECOND = tokenCategory({ id: 'defi' })

function mockTDPStore({ categoryIds, loaded }: { categoryIds: string[] | undefined; loaded: boolean }): void {
  const state = {
    multichainToken: categoryIds && { categoryIds },
    multichainTokenLoaded: loaded,
  } as unknown as TDPState
  mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
    selector(state)) as typeof useTDPStore)
}

describe('useTDPTokenCategories', () => {
  beforeEach(() => {
    mocked(useResolveTokenCategories).mockReturnValue({ categories: [], isLoading: true })
  })

  it('resolves the token category ids and reports them as loading until they hydrate', () => {
    mockTDPStore({ categoryIds: [FIRST.id, SECOND.id], loaded: true })

    const { result } = renderHook(() => useTDPTokenCategories())

    expect(useResolveTokenCategories).toHaveBeenCalledWith({ categoryIds: [FIRST.id, SECOND.id], isLoading: false })
    expect(result.current).toEqual({ categories: [], isLoading: true })
  })

  it('passes through the resolved categories once the lookup settles', () => {
    mockTDPStore({ categoryIds: [FIRST.id, SECOND.id], loaded: true })
    mocked(useResolveTokenCategories).mockReturnValue({ categories: [FIRST, SECOND], isLoading: false })

    const { result } = renderHook(() => useTDPTokenCategories())

    expect(result.current).toEqual({ categories: [FIRST, SECOND], isLoading: false })
  })

  it('is never loading for a token with no category ids, even while the lookup is', () => {
    mockTDPStore({ categoryIds: [], loaded: true })

    const { result } = renderHook(() => useTDPTokenCategories())

    expect(result.current).toEqual({ categories: [], isLoading: false })
  })

  it('is not loading before the token itself has loaded, since its ids are unknown', () => {
    mockTDPStore({ categoryIds: undefined, loaded: false })

    const { result } = renderHook(() => useTDPTokenCategories())

    expect(useResolveTokenCategories).toHaveBeenCalledWith({ categoryIds: undefined, isLoading: true })
    expect(result.current).toEqual({ categories: [], isLoading: false })
  })
})
