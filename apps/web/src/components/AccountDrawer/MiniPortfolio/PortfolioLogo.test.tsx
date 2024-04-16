import { ChainId } from '@jaguarswap/sdk-core'
import { DAI, DAI_ARBITRUM_ONE, USDC_ARBITRUM, USDC } from 'constants/tokens'
import { render } from 'test-utils/render'

import { PortfolioLogo } from './PortfolioLogo'

describe('PortfolioLogo', () => {
  it('renders without L2 icon', () => {
    const { container } = render(<PortfolioLogo chainId={ChainId.X1} currencies={[DAI, USDC]} />)
    expect(container).toMatchSnapshot()
  })

  it('renders with L2 icon', () => {
    const { container } = render(
      <PortfolioLogo chainId={ChainId.ARBITRUM_ONE} currencies={[DAI_ARBITRUM_ONE, USDC_ARBITRUM]} />
    )
    expect(container).toMatchSnapshot()
  })
})
