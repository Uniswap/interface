import type { PropsWithChildren } from 'react'
import { SearchModal } from '~/components/NavBar/SearchBar/SearchModal'
import { render, screen } from '~/test-utils/render'

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

vi.mock('uniswap/src/features/search/SearchModal/SearchModalResultsList', () => ({
  SearchModalResultsList: () => null,
}))

vi.mock('~/hooks/useModalState', () => ({
  useModalState: () => ({ isOpen: true, toggleModal: vi.fn() }),
}))

describe('SearchModal', () => {
  it.each([
    { isAuctionSearchEnabled: true, placeholder: 'Search tokens, pools, wallets and auctions' },
    { isAuctionSearchEnabled: false, placeholder: 'Search tokens, pools, and wallets' },
  ])('renders the provided placeholder: $placeholder', ({ isAuctionSearchEnabled, placeholder }) => {
    render(<SearchModal isAuctionSearchEnabled={isAuctionSearchEnabled} placeholder={placeholder} />)

    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument()
  })
})
