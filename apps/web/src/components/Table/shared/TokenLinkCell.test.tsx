import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { TokenLinkCell } from '~/components/Table/shared/TokenLinkCell'
import { render, screen } from '~/test-utils/render'

const usdcToken: ParsedToken = {
  chainId: UniverseChainId.Mainnet,
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
}

describe('TokenLinkCell', () => {
  it('renders unknown token', () => {
    const { asFragment } = render(<TokenLinkCell token={{ ...usdcToken, symbol: undefined }} />)
    expect(screen.getByText('UNKNOWN')).toBeDefined()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders known token on mainnet', () => {
    const { asFragment } = render(<TokenLinkCell token={usdcToken} />)
    expect(screen.getByText('USDC')).toBeDefined()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders known token on a different chain', () => {
    const { asFragment } = render(<TokenLinkCell token={{ ...usdcToken, chainId: UniverseChainId.Polygon }} />)
    const networkLogo = screen.getByTestId(`${TestID.NetworkLogoPrefix}${UniverseChainId.Polygon}`)
    expect(networkLogo.querySelector('img')).toHaveAttribute('src', expect.stringContaining('polygon-logo.png'))
    expect(asFragment()).toMatchSnapshot()
  })
})
