import { CategoryDetailsBreadcrumb } from '~/pages/Explore/CategoryDetails/CategoryDetailsBreadcrumb'
import { render, screen } from '~/test-utils/render'

const mockUseLocation = vi.fn()
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useLocation: () => mockUseLocation(),
}))

const TDP_PATH = '/explore/tokens/ethereum/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599?chain=base'

function renderWithState(state: unknown, kind: 'token' | 'pool' = 'token'): HTMLElement {
  mockUseLocation.mockReturnValue({ pathname: '/explore/category/defi', search: '', hash: '', key: 'k', state })
  render(<CategoryDetailsBreadcrumb kind={kind} categoryName="DeFi" />)
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

  it('links a pool category back to the Pools tab without an entry point', () => {
    const link = renderWithState(undefined, 'pool')
    expect(link).toHaveTextContent('Pools')
    expect(link).toHaveAttribute('href', '/explore/pools')
  })

  it('links a pool category back to the pool details page it was entered from', () => {
    const pdp = '/explore/pools/ethereum/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'
    const link = renderWithState({ from: pdp, fromLabel: 'USDC/ETH' }, 'pool')
    expect(link).toHaveTextContent('USDC/ETH')
    expect(link).toHaveAttribute('href', pdp)
  })
})
