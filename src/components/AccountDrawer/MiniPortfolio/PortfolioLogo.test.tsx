import { ChainId } from '@uniswap/sdk-core'
import { BRIDGED_USDC_ARBITRUM, DAI, DAI_ARBITRUM_ONE, USDC_MAINNET } from 'constants/tokens'
import { render } from 'test-utils/render'

import { PortfolioLogo } from './PortfolioLogo'

describe('PortfolioLogo', () => {
  it('renders without L2 icon', () => {
    const { container } = render(<PortfolioLogo chainId={ChainId.MAINNET} currencies={[DAI, USDC_MAINNET]} />)
    expect(container).toMatchSnapshot()
  })

  it('renders with L2 icon', () => {
    const { container } = render(
      <PortfolioLogo chainId={ChainId.ARBITRUM_ONE} currencies={[DAI_ARBITRUM_ONE, BRIDGED_USDC_ARBITRUM]} />
    )
    expect(container).toMatchSnapshot()
  })
})
