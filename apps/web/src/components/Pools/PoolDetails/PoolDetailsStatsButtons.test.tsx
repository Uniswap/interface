import userEvent from '@testing-library/user-event'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import store from 'state'
import { addSerializedToken } from 'state/user/reducer'
import { mocked } from 'test-utils/mocked'
import { useMultiChainPositionsReturnValue, validBEPoolToken0, validBEPoolToken1 } from 'test-utils/pools/fixtures'
import { act, render, screen } from 'test-utils/render'

import { PoolDetailsStatsButtons } from './PoolDetailsStatsButtons'

jest.mock('components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions')

describe('PoolDetailsStatsButton', () => {
  const mockProps = {
    chainId: 1,
    token0: validBEPoolToken0,
    token1: validBEPoolToken1,
    feeTier: 500,
  }

  const mockPropsTokensReversed = {
    ...mockProps,
    token0: validBEPoolToken1,
    token1: validBEPoolToken0,
  }

  beforeEach(() => {
    mocked(useMultiChainPositions).mockReturnValue(useMultiChainPositionsReturnValue)
    store.dispatch(
      addSerializedToken({
        serializedToken: {
          chainId: 1,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
      })
    )
    store.dispatch(
      addSerializedToken({
        serializedToken: {
          chainId: 1,
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
        },
      })
    )
  })

  it('loading skeleton shown correctly', () => {
    const { asFragment } = render(<PoolDetailsStatsButtons {...mockProps} loading={true} />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByTestId('pdp-buttons-loading-skeleton')).toBeVisible()
  })

  it('renders both buttons correctly', () => {
    const { asFragment } = render(<PoolDetailsStatsButtons {...mockProps} />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByTestId('pool-details-add-liquidity-button')).toBeVisible()
    expect(screen.getByTestId('pool-details-swap-button')).toBeVisible()
  })

  it('clicking swap reveals swap modal', async () => {
    render(<PoolDetailsStatsButtons {...mockProps} />)

    await act(() => userEvent.click(screen.getByTestId('pool-details-swap-button')))
    expect(screen.getByTestId('pool-details-swap-modal')).toBeVisible()
    expect(screen.getByTestId('pool-details-close-button')).toBeVisible()
  })

  it('clicking add liquidity goes to correct url', async () => {
    render(<PoolDetailsStatsButtons {...mockPropsTokensReversed} />)

    await act(() => userEvent.click(screen.getByTestId('pool-details-add-liquidity-button')))
    expect(globalThis.window.location.href).toContain(
      '/add/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/500'
    )
  })
})
