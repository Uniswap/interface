import { ChainId } from '@uniswap/sdk-core'
import { USDC_MAINNET } from 'constants/tokens'
import { render } from 'test-utils/render'

import { getLoadingTitle, TokenDetailsPageSkeleton } from './Skeleton'

describe('TDP Skeleton', () => {
  it('should render correctly', () => {
    const { asFragment } = render(<TokenDetailsPageSkeleton />)
    expect(asFragment()).toMatchSnapshot()
  })
})

describe('getLoadingTitle', () => {
  it('should return correct title', () => {
    const { asFragment } = render(
      <>{getLoadingTitle(USDC_MAINNET, USDC_MAINNET.address, ChainId.MAINNET, 'ethereum')}</>
    )
    expect(asFragment()).toMatchSnapshot()
    expect(asFragment().textContent).toContain('token data for')
    expect(asFragment().textContent).toContain('on Ethereum')
  })
})
