import type { PropsWithChildren } from 'react'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SearchModal } from '~/components/NavBar/SearchBar/SearchModal'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { act, fireEvent, render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/telemetry/send')

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
  return {
    ...actual,
    useMedia: vi.fn(),
  }
})

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: PropsWithChildren) => children,
}))

vi.mock('uniswap/src/components/modals/ScrollLock', () => ({
  useUpdateScrollLock: vi.fn(),
}))

vi.mock('uniswap/src/components/network/NetworkFilter', () => ({
  NetworkFilter: () => null,
}))

vi.mock('uniswap/src/features/search/SearchModal/SearchModalNoQueryList', () => ({
  SearchModalNoQueryList: () => null,
}))

// Stands in for the results list: reports two rows on screen and exposes a pick.
vi.mock('uniswap/src/features/search/SearchModal/SearchModalResultsList', async () => {
  const { useEffect } = await import('react')
  return {
    SearchModalResultsList: ({
      onSelect,
      onResultsShownChange,
    }: {
      onSelect: () => void
      onResultsShownChange: (count: number) => void
    }) => {
      useEffect(() => onResultsShownChange(2), [onResultsShownChange])
      return <button onClick={onSelect}>select-result</button>
    },
  }
})

vi.mock('~/hooks/useModalState', () => ({
  useModalState: () => ({ isOpen: true, toggleModal: vi.fn() }),
}))

describe('SearchModal', () => {
  beforeEach(() => {
    mockMediaSize('xxxl')
  })

  it.each([
    { isEnabled: true, expectedTabs: ['All', 'Tokens', 'Pools', 'Auctions', 'Wallets'] },
    { isEnabled: false, expectedTabs: ['All', 'Tokens', 'Pools', 'Wallets'] },
  ])(
    'renders the search field and ordered tabs when auction search enabled is $isEnabled',
    ({ isEnabled, expectedTabs }) => {
      render(<SearchModal isAuctionSearchEnabled={isEnabled} />)

      expect(screen.getByPlaceholderText('Search by name, symbol, or address')).toBeInTheDocument()
      expect(screen.getAllByText(/^(All|Tokens|Pools|Auctions|Wallets)$/).map((tab) => tab.textContent)).toEqual(
        expectedTabs,
      )
    },
  )

  it('labels a pick exit with the query and rows shown', () => {
    vi.useFakeTimers()
    render(<SearchModal isAuctionSearchEnabled={false} />)

    fireEvent.change(screen.getByPlaceholderText('Search by name, symbol, or address'), { target: { value: 'eth' } })
    // Let the debounced query catch up so the exit reports the settled input.
    act(() => {
      vi.advanceTimersByTime(300)
    })
    fireEvent.click(screen.getByText('select-result'))

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      InterfaceEventName.NavbarSearchExited,
      expect.objectContaining({
        navbar_search_input_text: 'eth',
        hasInput: true,
        result_selected: true,
        results_shown: 2,
      }),
    )
    vi.useRealTimers()
  })

  it('uses the short placeholder on small viewports, where the long copy clips', () => {
    mockMediaSize('sm')

    render(<SearchModal isAuctionSearchEnabled={false} />)

    expect(screen.getByPlaceholderText('Search Uniswap')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Search by name, symbol, or address')).not.toBeInTheDocument()
  })
})
