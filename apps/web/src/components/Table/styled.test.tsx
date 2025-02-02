import { TokenLinkCell } from 'components/Table/styled'
import { validBEPoolToken0 } from 'test-utils/pools/fixtures'
import { render, screen } from 'test-utils/render'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

describe('TokenLinkCell', () => {
  it('renders unknown token', () => {
    const { asFragment } = render(<TokenLinkCell token={{ ...validBEPoolToken0, symbol: undefined }} />)
    expect(screen.getByText('UNKNOWN')).toBeDefined()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders known token on mainnet', () => {
    const { asFragment } = render(<TokenLinkCell token={validBEPoolToken0} />)
    expect(screen.getByText('USDC')).toBeDefined()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders known token on a different chain', () => {
    const { asFragment } = render(<TokenLinkCell token={{ ...validBEPoolToken0, chain: Chain.Polygon }} />)
    const networkLogo = screen.getByTestId('network-logo')
    expect(networkLogo.querySelector('img')).toHaveAttribute('src', 'polygon-logo.png')
    expect(asFragment()).toMatchSnapshot()
  })
})
