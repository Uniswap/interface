import userEvent from '@testing-library/user-event'
import { GraphQLApi } from '@universe/api'
import { TokenDescription } from 'components/Tokens/TokenDetails/TokenDescription'
import { useCurrency } from 'hooks/Tokens'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { mocked } from 'test-utils/mocked'
import { validUSDCCurrency } from 'test-utils/pools/fixtures'
import { render, screen } from 'test-utils/render'
import { validTokenProjectResponse } from 'test-utils/tokens/fixtures'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'

vi.mock('hooks/Tokens')

vi.mock('pages/TokenDetails/TDPContext', () => ({
  useTDPContext: vi.fn(),
}))

describe('TokenDescription', () => {
  beforeEach(() => {
    mocked(useCurrency).mockReturnValue(validUSDCCurrency)
  })

  it('renders token information correctly with defaults', () => {
    mocked(useTDPContext).mockReturnValue({
      address: USDC_MAINNET.address,
      currency: USDC_MAINNET,
      currencyChainName: GraphQLApi.Chain.Ethereum,
      tokenQuery: validTokenProjectResponse,
    } as any)
    const { asFragment } = render(<TokenDescription />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText('Info')).toBeVisible()
    expect(screen.getByText('Website')).toBeVisible()
    expect(screen.getByText('Twitter')).toBeVisible()
    expect(screen.getByText('Etherscan')).toBeVisible()
    expect(screen.getByText('0xA0b8...eB48')).toBeVisible()
  })

  it('truncates description and shows more', async () => {
    mocked(useTDPContext).mockReturnValue({
      address: USDC_MAINNET.address,
      currency: USDC_MAINNET,
      currencyChainName: GraphQLApi.Chain.Ethereum,
      tokenQuery: validTokenProjectResponse,
    } as any)
    const { asFragment } = render(<TokenDescription />)

    expect(asFragment()).toMatchSnapshot()
    const truncatedDescription = screen.getByTestId('token-description-truncated')
    const fullDescription = screen.getByTestId('token-description-full')

    expect(truncatedDescription).toHaveClass('_display-inline')
    expect(fullDescription).toHaveClass('_display-none')

    await userEvent.click(screen.getByText('Show more'))
    expect(truncatedDescription).toHaveClass('_display-none')
    expect(fullDescription).toHaveClass('_display-inline')
    expect(screen.getByText('Hide')).toBeVisible()
  })

  it('no description or social buttons shown when not available', async () => {
    mocked(useTDPContext).mockReturnValue({
      address: USDC_MAINNET.address,
      currency: USDC_MAINNET,
      currencyChainName: GraphQLApi.Chain.Ethereum,
      tokenQuery: { data: undefined, loading: false, error: undefined },
    } as any)
    const { asFragment } = render(<TokenDescription />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText('No token information available')).toBeVisible()
    expect(screen.queryByText('Website')).toBeNull()
    expect(screen.queryByText('Twitter')).toBeNull()
    expect(screen.getByText('Etherscan')).toBeVisible()
    expect(screen.getByText('0xA0b8...eB48')).toBeVisible()
  })
})
