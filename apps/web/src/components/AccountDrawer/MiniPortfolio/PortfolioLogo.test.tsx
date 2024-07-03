import 'test-utils/tokens/mocks'

import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { DAI, DAI_ARBITRUM_ONE, USDC_ARBITRUM, USDC_MAINNET } from 'constants/tokens'
import { render } from 'test-utils/render'
import 'test-utils/tokens/mocks'
import { UniverseChainId } from 'uniswap/src/types/chains'

describe('PortfolioLogo', () => {
  it('renders without L2 icon', () => {
    const { container } = render(<PortfolioLogo chainId={UniverseChainId.Mainnet} currencies={[DAI, USDC_MAINNET]} />)
    expect(container).toMatchSnapshot()
  })

  it('renders with L2 icon', () => {
    const { container } = render(
      <PortfolioLogo chainId={UniverseChainId.ArbitrumOne} currencies={[DAI_ARBITRUM_ONE, USDC_ARBITRUM]} />,
    )
    expect(container).toMatchSnapshot()
  })
})
