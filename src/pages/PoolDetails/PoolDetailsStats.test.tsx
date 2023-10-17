import { enableNetConnect } from 'nock'
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
  })

  it('renders stats text correctly', async () => {
    const { asFragment } = render(<PoolDetailsStats {...mockProps} />)
    // After the first render, the extracted color is updated to an a11y compliant color
    // This is why we need to wrap the fragment in act(...)
    await act(async () => {
      await asFragment
    })
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText(/Stats/i)).toBeInTheDocument()
    expect(screen.getByText('90.93M USDC')).toBeInTheDocument()
    expect(screen.getByText('82,526.49 WETH')).toBeInTheDocument()
    expect(screen.getByText(/TVL/i)).toBeInTheDocument()
    expect(screen.getByText('$223.2M')).toBeInTheDocument()
    expect(screen.getByTestId('pool-balance-chart')).toBeInTheDocument()
  })

  it('pool balance chart not visible on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: BREAKPOINTS.md,
    })
    const { asFragment } = render(<PoolDetailsStats {...mockProps} />)
    await act(async () => {
      await asFragment
    })
    expect(asFragment()).toMatchSnapshot()

    expect(screen.queryByTestId('pool-balance-chart')).toBeNull()
  })
})
