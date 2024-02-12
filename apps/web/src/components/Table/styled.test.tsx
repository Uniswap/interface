import { ChainId, Currency } from '@uniswap/sdk-core'
import { TokenLinkCell } from 'components/Table/styled'
import { useCurrency } from 'hooks/Tokens'
import { mocked } from 'test-utils/mocked'
import { validUSDCCurrency } from 'test-utils/pools/fixtures'
import { render, screen } from 'test-utils/render'

jest.mock('hooks/Tokens')

describe('TokenLinkCell', () => {
  it('renders unknown token', () => {
    mocked(useCurrency).mockReturnValue({ ...validUSDCCurrency, symbol: undefined } as unknown as Currency)
    const { asFragment } = render(<TokenLinkCell tokenAddress="unknown" chainId={ChainId.MAINNET} />)
    expect(screen.getByText('UNKNOWN')).toBeDefined()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders known token on mainnet', () => {
    mocked(useCurrency).mockReturnValue(validUSDCCurrency)
    const { asFragment } = render(
      <TokenLinkCell tokenAddress={validUSDCCurrency.wrapped.address} chainId={ChainId.MAINNET} />
    )
    expect(screen.getByText('USDC')).toBeDefined()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders known token on a different chain', () => {
    mocked(useCurrency).mockReturnValue({ ...validUSDCCurrency, chainId: ChainId.POLYGON } as unknown as Currency)
    const { asFragment } = render(
      <TokenLinkCell tokenAddress={validUSDCCurrency.wrapped.address} chainId={ChainId.POLYGON} />
    )
    expect(screen.getByText('Polygon logo')).toBeDefined()
    expect(asFragment()).toMatchSnapshot()
  })
})
