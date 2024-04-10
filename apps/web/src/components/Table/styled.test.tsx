import { TokenLinkCell } from 'components/Table/styled'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { validBEPoolToken0 } from 'test-utils/pools/fixtures'
import { render, screen } from 'test-utils/render'

jest.mock('hooks/Tokens')

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
    expect(screen.getByText('Polygon logo')).toBeDefined()
    expect(asFragment()).toMatchSnapshot()
  })
})
