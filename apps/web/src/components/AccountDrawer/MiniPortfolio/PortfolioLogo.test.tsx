import 'test-utils/tokens/mocks'

import { ChainId } from '@uniswap/sdk-core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { DAI, DAI_ARBITRUM_ONE, USDC_ARBITRUM, USDC_MAINNET } from 'constants/tokens'
import { render } from 'test-utils/render'

describe('PortfolioLogo', () => {
  it('renders without L2 icon', () => {
    const { container } = render(<PortfolioLogo chainId={ChainId.MAINNET} currencies={[DAI, USDC_MAINNET]} />)
    expect(container).toMatchSnapshot()
  })

  it('renders with L2 icon', () => {
    const { container } = render(
      <PortfolioLogo chainId={ChainId.ARBITRUM_ONE} currencies={[DAI_ARBITRUM_ONE, USDC_ARBITRUM]} />
    )
    expect(container).toMatchSnapshot()
  })
})
