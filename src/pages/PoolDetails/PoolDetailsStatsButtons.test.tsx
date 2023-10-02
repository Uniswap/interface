import userEvent from '@testing-library/user-event'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import { mocked } from 'test-utils/mocked'
import { useMultiChainPositionsReturnValue, validPoolToken0, validPoolToken1 } from 'test-utils/pools/fixtures'
import { act, render, screen } from 'test-utils/render'

import { PoolDetailsStatsButtons } from './PoolDetailsStatsButtons'

jest.mock('components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions')

describe('PoolDetailsStatsButton', () => {
  const mockProps = {
    chainId: 1,
    token0: validPoolToken0,
    token1: validPoolToken1,
    feeTier: 500,
  }

  const mockPropsTokensReversed = {
    ...mockProps,
    token0: validPoolToken1,
    token1: validPoolToken0,
  }

  beforeEach(() => {
    mocked(useMultiChainPositions).mockReturnValue(useMultiChainPositionsReturnValue)
  })

  it('renders both buttons correctly', () => {
    const { asFragment } = render(<PoolDetailsStatsButtons {...mockProps} />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByTestId('pool-details-add-liquidity-button')).toBeVisible()
    expect(screen.getByTestId('pool-details-swap-button')).toBeVisible()
  })

  it('clicking swap goes to correct url', async () => {
    render(<PoolDetailsStatsButtons {...mockProps} />)

    await act(() => userEvent.click(screen.getByTestId('pool-details-swap-button')))
    expect(global.window.location.href).toContain(
      '/swap?inputCurrency=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&outputCurrency=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    )
  })

  it('clicking swap goes to correct url with tokens reversed', async () => {
    render(<PoolDetailsStatsButtons {...mockPropsTokensReversed} />)

    await act(() => userEvent.click(screen.getByTestId('pool-details-swap-button')))
    expect(global.window.location.href).toContain(
      '/swap?inputCurrency=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&outputCurrency=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    )
  })

  it('clicking add liquidity goes to correct url', async () => {
    render(<PoolDetailsStatsButtons {...mockPropsTokensReversed} />)

    await act(() => userEvent.click(screen.getByTestId('pool-details-add-liquidity-button')))
    expect(global.window.location.href).toContain(
      '/increase/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/500'
    )
  })
})
