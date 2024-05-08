import userEvent from '@testing-library/user-event'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import store from 'state'
import { addSerializedToken } from 'state/user/reducer'
import { act, render, screen } from 'test-utils/render'

import { usdcWethPoolAddress, validBEPoolToken0, validBEPoolToken1 } from 'test-utils/pools/fixtures'
import { PoolsDetailsChartType } from './ChartSection'
import { PoolDetailsBreadcrumb, PoolDetailsHeader } from './PoolDetailsHeader'

describe('PoolDetailsHeader', () => {
  beforeEach(() => {
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

  const mockBreadcrumbProps = {
    chainId: 1,
    token0: validBEPoolToken0,
    token1: validBEPoolToken1,
    poolAddress: usdcWethPoolAddress,
  }

  const mockHeaderProps = {
    chainId: 1,
    poolAddress: usdcWethPoolAddress,
    token0: validBEPoolToken0,
    token1: validBEPoolToken1,
    chartType: ChartType.PRICE as PoolsDetailsChartType,
    onChartTypeChange: jest.fn(),
    priceChartType: PriceChartType.LINE,
    onPriceChartTypeChange: jest.fn(),
    feeTier: 500,
    toggleReversed: jest.fn(),
  }

  it('loading skeleton is shown', () => {
    const { asFragment } = render(<PoolDetailsHeader {...mockHeaderProps} loading={true} />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByTestId('pdp-header-loading-skeleton')).toBeInTheDocument()
  })

  it('renders breadcrumb text correctly', () => {
    const { asFragment } = render(<PoolDetailsBreadcrumb {...mockBreadcrumbProps} />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText(/Explore/i)).toBeInTheDocument()
    expect(screen.getByText(/Pools/i)).toBeInTheDocument()
    expect(screen.getAllByText(/USDC\s*\/\s*WETH/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/0x88e6...5640/i)).toBeInTheDocument()
  })

  it('renders header text correctly', () => {
    const { asFragment } = render(<PoolDetailsHeader {...mockHeaderProps} />)
    expect(asFragment()).toMatchSnapshot()

    const usdcLink = document.querySelector(
      'a[href="/explore/tokens/ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"]'
    )
    const wethLink = document.querySelector(
      'a[href="/explore/tokens/ethereum/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"]'
    )
    expect(usdcLink?.textContent).toBe('USDC')
    expect(wethLink?.textContent).toBe('WETH')
    expect(screen.getByText('0.05%')).toBeInTheDocument()
  })

  it('calls toggleReversed when arrows are clicked', async () => {
    render(<PoolDetailsHeader {...mockHeaderProps} />)

    await act(() => userEvent.click(screen.getByTestId('toggle-tokens-reverse-arrows')))

    expect(mockHeaderProps.toggleReversed).toHaveBeenCalledTimes(1)
  })
})
