import { enableNetConnect } from 'nock'
import store from 'state'
import { addSerializedToken } from 'state/user/reducer'
import { validPoolDataResponse } from 'test-utils/pools/fixtures'
import { act, render, screen } from 'test-utils/render'
import { BREAKPOINTS } from 'theme'

import { PoolDetailsStats } from './PoolDetailsStats'

describe('PoolDetailsStats', () => {
  const mockProps = {
    poolData: validPoolDataResponse.data,
    isReversed: false,
    chainId: 1,
  }

  beforeEach(() => {
    // Enable network connections for retrieving token logos
    enableNetConnect()
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

  it('renders stats text correctly', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: BREAKPOINTS.xl,
    })

    const { asFragment } = render(<PoolDetailsStats {...mockProps} />)
    // After the first render, the extracted color is updated to an a11y compliant color
    // This is why we need to wrap the fragment in act(...)
    await act(async () => {
      await asFragment
    })
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText(/Stats/i)).toBeInTheDocument()
    expect(screen.getByText('90.9M')).toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('82.5K')).toBeInTheDocument()
    expect(screen.getByText('ETH')).toBeInTheDocument()
    expect(screen.getByText(/TVL/i)).toBeInTheDocument()
    expect(screen.getByText('$223.2M')).toBeInTheDocument()
    expect(screen.getByTestId('pool-balance-chart')).toBeInTheDocument()
  })

  it('pool balance chart not visible on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: BREAKPOINTS.lg,
    })
    const { asFragment } = render(<PoolDetailsStats {...mockProps} />)
    await act(async () => {
      await asFragment
    })
    expect(asFragment()).toMatchSnapshot()

    expect(screen.queryByTestId('pool-balance-chart')).toBeNull()
  })
})
