import '~/test-utils/tokens/mocks'
import { within } from '@testing-library/react'
import { DAI, DAI_ARBITRUM_ONE } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { PendingPortfolioLogo } from '~/components/AccountDrawer/MiniPortfolio/PendingPortfolioLogo'
import { render, screen } from '~/test-utils/render'

describe('PendingPortfolioLogo', () => {
  it('renders the animated pending ring', () => {
    render(<PendingPortfolioLogo chainId={UniverseChainId.Mainnet} currencies={[DAI]} />)

    const pendingLogo = screen.getByTestId(TestID.ActivityPopupPendingLogo)
    expect(pendingLogo).toBeInTheDocument()
    expect(within(pendingLogo).getByTestId(TestID.ActivityPopupPendingRing)).toBeInTheDocument()
  })

  it('preserves the lower-right network badge inside the pending logo frame', () => {
    render(<PendingPortfolioLogo chainId={UniverseChainId.ArbitrumOne} currencies={[DAI_ARBITRUM_ONE]} />)

    const pendingLogo = screen.getByTestId(TestID.ActivityPopupPendingLogo)
    expect(within(pendingLogo).getByTestId(TestID.ActivityPopupPendingRing)).toBeInTheDocument()
    expect(
      within(pendingLogo).getByTestId(`${TestID.NetworkLogoPrefix}${UniverseChainId.ArbitrumOne}`),
    ).toBeInTheDocument()
  })
})
