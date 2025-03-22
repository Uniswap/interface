import 'test-utils/tokens/mocks'

import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { render } from 'test-utils/render'
import { DAI, DAI_ARBITRUM_ONE, USDC_ARBITRUM, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

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
