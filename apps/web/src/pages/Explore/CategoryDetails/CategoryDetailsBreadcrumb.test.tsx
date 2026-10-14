import { CategoryDetailsBreadcrumb } from '~/pages/Explore/CategoryDetails/CategoryDetailsBreadcrumb'
import { render, screen } from '~/test-utils/render'

const mockUseLocation = vi.fn()
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useLocation: () => mockUseLocation(),
}))

const TDP_PATH = '/explore/tokens/ethereum/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599?chain=base'

function renderWithState(state: unknown): HTMLElement {
  mockUseLocation.mockReturnValue({ pathname: '/explore/category/defi', search: '', hash: '', key: 'k', state })
  render(<CategoryDetailsBreadcrumb categoryName="DeFi" />)
  return screen.getByRole('link')
}

describe('CategoryDetailsBreadcrumb', () => {
  it('links back to the Tokens tab without an entry point', () => {
    const link = renderWithState(undefined)
    expect(link).toHaveTextContent('Tokens')
    expect(link).toHaveAttribute('href', '/explore/tokens')
    expect(screen.getByText('DeFi')).toBeInTheDocument()
  })

  it('links back to the token details page it was entered from, labeled with the ticker', () => {
    const link = renderWithState({ from: TDP_PATH, fromLabel: 'WBTC' })
    expect(link).toHaveTextContent('WBTC')
    expect(link).toHaveAttribute('href', TDP_PATH)
  })

  it('links back to the Tokens tab when the entry point is rejected', () => {
    const link = renderWithState({ from: '//evil.com/explore/tokens/x', fromLabel: 'WBTC' })
    expect(link).toHaveTextContent('Tokens')
    expect(link).toHaveAttribute('href', '/explore/tokens')
  })
})
