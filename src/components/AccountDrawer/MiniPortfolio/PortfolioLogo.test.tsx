import { SupportedChainId } from '@uniswap/sdk-core'
import { DAI_ARBITRUM } from '@uniswap/smart-order-router'
import { BRIDGED_USDC_ARBITRUM, DAI, USDC_MAINNET } from 'constants/tokens'
import { render } from 'test-utils/render'

import { PortfolioLogo } from './PortfolioLogo'

describe('PortfolioLogo', () => {
  it('renders without L2 icon', () => {
    const { container } = render(<PortfolioLogo chainId={SupportedChainId.MAINNET} currencies={[DAI, USDC_MAINNET]} />)
    expect(container).toMatchSnapshot()
  })

  it('renders with L2 icon', () => {
    const { container } = render(
      <PortfolioLogo chainId={SupportedChainId.ARBITRUM_ONE} currencies={[DAI_ARBITRUM, BRIDGED_USDC_ARBITRUM]} />
    )
    expect(container).toMatchSnapshot()
  })
})
